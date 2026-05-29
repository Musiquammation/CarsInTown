#include "roadconsts.h"


static const float MAX_SPEED = 0.15f;
static const float GAMMA = 25.0f;
static const int BOUND = 125;


static int evalRoadConst(float x) {
	static const float INV_GAMMA = 1/GAMMA;
	static const float M = (1-INV_GAMMA) / MAX_SPEED;
	
	float y = 1 - M * x;
	return (int)(y*BOUND);
}

static int getMax() {
	static int opti = -1;
	
	if (opti >= 0)
		return opti;

	opti = evalRoadConst(MAX_SPEED);
	return opti;  
}

int getRoadCost(float speed) {
	if (speed >= MAX_SPEED) {
		return getMax();
	}

	if (speed <= 0.0f) {
		return BOUND;
	}

	return evalRoadConst(speed);
}


int getPathCost(int cost) {
	if (cost == 0) {return getMax();}
	if (cost < 0) {return getMax();}
	return cost;
}
