#include "getDanger.h"
#include "Car.h"
#include "Path.h"
#include "Api.h"
#include "PathStep.h"
#include "cell_t.h"
#include "CellTypeEnum.h"



#include <stddef.h>
#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <stdbool.h>


static const float CAR_WIDTH = .9f;
static const float CAR_HEIGHT = .6f;

static const float SPEED_LIMIT_FACTOR = 0.01f;
static const float INFINITY_F = 3e30f;

static const int FRONT_RANGE = 64;
static const int PRIORITY_RANGE = 32;
static const float SOFT_DECELERATION = .002f;
static const float FRONT_DECELERATION = .009f;
static const float MAX_ACCELERATION = .003f;
static const int SPEED_FACTOR = 30;


static const int DX[4] = {  1,  0, -1,  0 };
static const int DY[4] = {  0, -1,  0,  1 };


typedef enum {
	RIGHT,
	UP,
	LEFT,
	DOWN
} Direction;



static Car* getCar(int x, int y) {
	int left = 0;
	int right = api.cars_length - 1;

	while (left <= right) {
		int mid = left + (right - left) / 2;
		Car* car = &api.cars[mid];

		if (car->x < x || (car->x == x && car->y < y)) {
			left = mid + 1;
		}
		else if (car->x > x || (car->x == x && car->y > y)) {
			right = mid - 1;
		}
		else {
			return car;
		}
	}

	return NULL;
}

/**
 * @param inf Value returned if acceleration is not at stake
 */
static float computeAcceleration(
	float vx0, float vy0,
	float a_y,
	float vx_max, float vy_max,
	float X, float Y, float inf
) {
	a_y=0; // it created bugs because a_y was alterning

	// Handle already inside cases
	if (X<0 || Y<0) {
		return -inf; // stop
	}

	if (X<0)
		return inf; // accelerate

	// Helper: compute y(t) saturation parameters
	float t_star;
	float Vysat;

	if (a_y > 0.0f) {
		Vysat = vy_max;
		t_star = (vy_max - vy0) / a_y;
	} else if (a_y < 0.0f) {
		Vysat = 0.0f;
		t_star = -vy0 / a_y;
	} else { // a_y == 0
		Vysat = vy0;
		t_star = INFINITY_F;
	}

	// Compute T such that y(T) = Y
	float T;

	if (a_y > 0.0f) {
		float discriminant = vy0 * vy0 + 2.0f * a_y * Y;
		if (discriminant < 0.0f) return INFINITY_F;

		float T_before = (-vy0 + sqrtf(discriminant)) / a_y;

		if (T_before <= t_star) {
			T = T_before;
		} else {
			float y_star = vy0 * t_star + 0.5f * a_y * t_star * t_star;
			T = t_star + (Y - y_star) / Vysat;
		}

	} else if (a_y == 0.0f) {
		if (vy0 <= 0.0f) return inf;
		T = Y / vy0;

	} else { // a_y < 0
		float discriminant = vy0 * vy0 + 2.0f * a_y * Y;
		if (discriminant < 0.0f) return inf;

		float T_before = (-vy0 + sqrtf(discriminant)) / a_y;

		if (T_before <= t_star) {
			T = T_before;
		} else {
			float y_max = vy0 * t_star + 0.5f * a_y * t_star * t_star;
			if (Y > y_max) return inf;
			T = t_star;
		}
	}

	// Avoid division by zero
	if (T <= 0.0f) return inf;


	// Compute candidate a_x without x saturation
	float a_x_noSat = 2.0f * (X - vx0 * T) / (T * T);


	if (a_x_noSat > 0.0f) {
		
		// Fix saturation
		if (vx0 + a_x_noSat * T > vx_max) {
			float maxDist = vx_max*T - X;

			// Check if even instantly at maxSpeed,
			// we can't pass at time (car too slow)
			if (maxDist <= 0) {
				return +INFINITY_F;
			}

			float n = vx_max - vx0;
			return 0.5f * n*n / maxDist;
		}

	} else if (a_x_noSat < 0.0f) {
		// Fix saturation
		if (vx0 + a_x_noSat * T < 0.0f) {
			return -vx0/T;
		}
	}

	return a_x_noSat;
}

typedef struct {
	int x;
	int y;
	Direction dir;
} Spy;

typedef struct SpyNode {
	int x;
	int y;
	int dist;
	Direction dir;
	Direction oppDir;
	struct SpyNode* next;
} SpyNode;

static void moveSpy(Spy* spy) {
	spy->x += DX[spy->dir];
	spy->y += DY[spy->dir];
}

static void moveSpyNode(SpyNode* spy) {
	spy->x += DX[spy->dir];
	spy->y += DY[spy->dir];
}

static cell_t take(int x, int y) {
	return api.map[y * api.map_size + x];
}




typedef struct {
	Car car;
	Car* carPtr;
	float carSpeed2;
	float maxAcc;
	float slow;
	float fast;
	bool hasGotPriority;
	int lightStepFlag;
	PathStep* steps;
	int pathStep;
	int pathX;
	int pathY;
} Buffer;

static void appendStopDist(Buffer* bff, float dist, float deceleration) {
	#define stopDist ((.5f/deceleration) * bff->carSpeed2)
	// Slow down
	if (dist <= 0) {
		bff->maxAcc = -bff->car.speed;

	} else if (dist < stopDist) {
		float acc = -.5f * bff->carSpeed2 / dist;
		if (acc < bff->maxAcc) {
			bff->maxAcc = acc;
		}
		

	} else if (bff->maxAcc > 0) {
		float acc = (bff->car.speedLimit - bff->car.speed) * (1.0f/SPEED_FACTOR);
		if (acc < bff->maxAcc) {
			bff->maxAcc = acc;
		}
	}

	// Check if next speed will exceed
	if (bff->car.speed + bff->maxAcc >= dist) {
		bff->maxAcc = dist - bff->car.speed;
	}

	
	#undef stopDist
}


static void checkPriority(Buffer* buffer, Spy spy0, int frontDist) {
	SpyNode* head = malloc(sizeof(SpyNode));
	head->x = spy0.x;
	head->y = spy0.y;
	head->dist = 0;
	head->dir = spy0.dir;
	head->oppDir = (spy0.dir+2)%4;
	head->next = NULL;

	for (int count = 1; count <= PRIORITY_RANGE; count++) {
		for (SpyNode *spy = head, *prev = NULL; spy; ) {
			spy->dist++;
			moveSpyNode(spy);
			bool jumpToDeleteSpy = false;
	
			cell_t cell = take(spy->x, spy->y);
			switch (cell & 0xf) {
				case CELL_VOID: {
					goto deleteSpy;
				}
	
				case CELL_ROAD: {
					break;
				}
	
				case CELL_TARGET: {
					/// TODO: handle cars skipping the target (in pathfinding?)
					goto deleteSpy;
				}
	
				case CELL_DIRECTION: {
					break;
				}
	
				case CELL_YIELD: {
					if (((cell >> 6) & 0x3) == spy->oppDir) {
						/**
						 * TODO: skip block and continue with others
						 */
						goto deleteSpy;
					}
					break;
				}

				case CELL_LIGHT: {
					if (((cell >> 12) & 0x3) != spy->oppDir)
						break; // wrong light direction

					if ((cell & buffer->lightStepFlag) == 0) {
						if (spy->dist == 1) {
							// Car is running red light
							jumpToDeleteSpy = true;
							goto checkCar;
						}


						// Light is red
						goto deleteSpy;
					}
					
					break;
				}
	
				
			}
	
	
			// Check car presence
			checkCar:
			if (cell & (1<<15)) {
				Car* other = getCar(spy->x, spy->y);
				if (other == buffer->carPtr)
					goto nextSpy;

				if (other->direction != spy->oppDir)
					goto nextSpy; // car is not a danger

				
				float carEntryDist = (float)frontDist - buffer->car.step +
					(1 - CAR_WIDTH/2);

				float carExitDist = (float)frontDist - buffer->car.step + 2 + (CAR_WIDTH/2);

				float sideEntryDist = (float)spy->dist - other->step - CAR_WIDTH/2;

				float sideExitDist = (float)spy->dist - other->step + 1 + CAR_WIDTH/2;


				float fastAcc = computeAcceleration(
					buffer->car.speed, other->speed,
					0,
					buffer->car.speedLimit, other->speedLimit,
					carExitDist, sideEntryDist, -INFINITY_F
				);

				// Needs to wait the car with the priority
				float slowAcc = computeAcceleration(
					buffer->car.speed, other->speed,
					0,
					buffer->car.speedLimit, other->speedLimit,
					carEntryDist, sideExitDist, INFINITY_F
				);



				if (slowAcc == INFINITY_F) // is this case even possible?
					slowAcc = buffer->maxAcc;

				if (slowAcc < buffer->slow)
					buffer->slow = slowAcc;

				if (fastAcc > buffer->fast)
					buffer->fast = fastAcc;

				buffer->hasGotPriority = true;

			}

			if (jumpToDeleteSpy)
				goto deleteSpy;
	
			// Next node
			nextSpy:
			{
				prev = spy;
				spy = spy->next;
				continue;
			}
	
	
			deleteSpy:
			{
				// Delete spy
				SpyNode* next = spy->next;
	
				if (prev) {
					prev->next = next;
				} else if (next) {
					head = next;
				} else {
					goto exitPriorities; // no spies left
				}
	
				free(spy);
				spy = next;
			}
		}
	}


	exitPriorities:
	for (SpyNode* node = head; node; ) {
		SpyNode* next = node->next;
		free(node);
		node = next;
	}
}


int getDanger(Car* car) {
	Buffer bff = {
		.car = *car,
		.carPtr = car,
		.carSpeed2 = car->speed * car->speed,
		.maxAcc = MAX_ACCELERATION,
		.slow = INFINITY_F,
		.fast = -INFINITY_F,
		.hasGotPriority = false,
		.lightStepFlag = 1 << (api.lightStep+4)
	};

	// Define path
	{
		Path* path = &api.paths[car->pathId];
		bff.steps = path->steps;
		bff.pathStep = path->step;

		PathStep* step = &path->steps[path->step];
		bff.pathX = step->x;
		bff.pathY = step->y;
	}

	
	Spy spy = {bff.car.x, bff.car.y, bff.car.direction};

	for (int dist = 0; dist <= FRONT_RANGE; dist++) {
		cell_t cell = take(spy.x, spy.y);

		bool checkLeft;
		bool checkRight;


		// Check stop and priorities
		switch (cell & 0xf) {
			case CELL_VOID: {
				appendStopDist(
					&bff,
					(float)dist - bff.car.step - CAR_WIDTH/2,
					SOFT_DECELERATION
				);
				goto finish;
			}

			case CELL_ROAD:
			case CELL_TARGET:
			case CELL_DIRECTION: {
				checkLeft = false;
				checkRight = true;

				defaultDetection:
				if ((cell & (1<<15)) == 0)
					break; // no car

				Car* other = getCar(spy.x, spy.y);
				if (other == NULL)
					return 1; // error

				if (other == bff.carPtr)
					break; // don't stop for ourselves

				float stopDist;
				int otherDirection = other->direction;
				if (otherDirection == spy.dir) {
					float shrinkedStep = other->step - CAR_WIDTH/2;
					if (shrinkedStep > 0)
						shrinkedStep = 0;

					stopDist = (float)dist + shrinkedStep - bff.car.step - CAR_WIDTH/2;

				} else if (otherDirection == ((spy.dir+2)%4)) {
					if (dist == 0)
						return 2; // collision

					/// TODO: handle cars in opposite direction
					break;

				} else { // Side direction
					stopDist = (float)dist - bff.car.step + (
						(1-CAR_HEIGHT)/2 - CAR_WIDTH/2);
				}

				appendStopDist(&bff, stopDist, SOFT_DECELERATION);
				break;
			}

			case CELL_YIELD: {
				checkLeft = true;
				checkRight = true;
				goto defaultDetection;
			}

			case CELL_LIGHT: {
				checkLeft = false;
				checkRight = true;

				// Run red light
				if (dist == 0) {
					goto defaultDetection;
				}

				if (((cell >> 12) & 0x3) != spy.dir)
					goto defaultDetection; // wrong light direction


				if ((cell & bff.lightStepFlag) == 0) {
					appendStopDist(
						&bff,
						(float)dist - bff.car.step - CAR_WIDTH/2,
						SOFT_DECELERATION
					);
				}


				goto defaultDetection;
				break;
			}
		}

		// Move
		moveSpy(&spy);


		// Check priorities
		if (checkRight) {
			Spy cpy = {spy.x, spy.y, (spy.dir+3)%4}; // turn to right
			checkPriority(&bff, cpy, dist);
		}
		
		if (checkLeft) {
			Spy cpy = {spy.x, spy.y, (spy.dir+1)%4}; // turn to left
			checkPriority(&bff, cpy, dist);
		}


		// Check for turn
		if (spy.x == bff.pathX && spy.y == bff.pathY) {
			spy.dir = bff.steps[bff.pathStep].dir;
			
			if (spy.dir == -1) {
				// Path is finished
				goto finish;
			}

			
			bff.pathStep++;
			bff.pathX = bff.steps[bff.pathStep].x;
			bff.pathY = bff.steps[bff.pathStep].y;
		}
	}



	finish:

	if (bff.hasGotPriority) {
		bff.maxAcc = (bff.fast <= bff.maxAcc) ? 
			bff.maxAcc : (bff.slow < bff.maxAcc ?
				bff.slow : bff.maxAcc);

	}
	

	car->out_acc = bff.maxAcc;
	car->out_speedLimit = car->speedLimit;

	return 0; // no errors
}





