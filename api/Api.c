#include "Api.h"
#include "Car.h"
#include "Path.h"
#include "cell_t.h"
#include "getDanger.h"
#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>



Api api;

cell_t* Api_init(int mapSize) {	
	if (sizeof(Car) != 44) {
		fprintf(stderr,"Error: sizeof(Car) == %lu != 44\n", sizeof(Car));
		return NULL;
	}

	api.cars_reserved = 16;
	api.path_reserved = 16;


	api.map = calloc(mapSize*mapSize, sizeof(cell_t));
	api.paths = calloc(api.path_reserved, sizeof(cell_t));
	api.cars = (Car*)malloc(sizeof(Car) * api.cars_reserved);
	api.cars_length = 0;
	api.map_size = mapSize;

	return api.map;
}

void Api_cleanup() {
	for (int i = 0; i < api.path_reserved; i++) {
		Path_destroy(&api.paths[i]);
	}
	free(api.paths);
	free(api.cars);
	free(api.map);
}

int* Api_reserveCars(int length) {
	if (length > api.cars_reserved) {
		api.cars_reserved = length * 2;
		free(api.cars);
		api.cars = (Car*)malloc(sizeof(Car) * api.cars_reserved);
	}

	api.cars_length = length;
	return (int*)api.cars;
}

static int compareCarXY(const void *a, const void *b) {
	const Car* carA = a;
	const Car* carB = b;

	if (carA->x < carB->x) return -1;
	if (carA->x > carB->x) return 1;
	if (carA->y < carB->y) return -1;
	if (carA->y > carB->y) return 1;
	return 0;
}

void Api_getDangers() {
	const Car* end = api.cars + api.cars_length;
	
	// Add marks
	for (Car* car = api.cars; car < end; car++)
		api.map[car->y * api.map_size + car->x] |= (1<<15);

	// Sort cars by (x, y)
	qsort(
		api.cars,
		api.cars_length,
		sizeof(Car),
		compareCarXY
	);

	// Call getDanger
	for (Car* car = api.cars; car < end; car++)
		getDanger(car);

	// Remove marks
	for (Car* car = api.cars; car < end; car++)
		api.map[car->y * api.map_size + car->x] &= ~(1<<15);
}


int Api_addPath(int startDir, int srcX, int srcY, int dstX, int dstY) {
	// Search empty pathfinding
	int i = 0;
	for (; i < api.path_reserved; i++) {
		if (Path_isAlive(&api.paths[i])) {
			continue;
		}

		goto makePath;
	}

	// Reserve twice space (path is full)
	{
		int nextReserved = api.path_reserved * 2;
		Path* newPaths = malloc(nextReserved * sizeof(Path));
		memcpy(newPaths, api.paths, api.path_reserved * sizeof(Path));
		free(api.paths);
		api.paths = newPaths;
		api.path_reserved = nextReserved;

		i = api.path_reserved;
	}



	makePath:
	return Path_make(&api.paths[i], startDir, srcX, srcY, dstX, dstY)
		? i : (-1);
}

void Api_removePath(int id) {
	Path_destroy(&api.paths[id]);
}


int* Api_movePath(int id) {
	Path* path = &api.paths[id];
	path->step++;
	if (path->step >= path->length)
		return NULL;

	return (int*)&path->steps[path->step];
}
