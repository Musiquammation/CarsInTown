#include "Api.h"
#include "Car.h"
#include "Path.h"
#include "cell_t.h"
#include "getDanger.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

Api api;

cell_t* Api_init(int mapSize) {	
	if (sizeof(Car) != 40) {
		fprintf(stderr,"Error: sizeof(Car) == %lu != 40\n", sizeof(Car));
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

void Api_getDangers() {
	const Car* end = api.cars + api.cars_length;
	for (Car* car = api.cars; car < end; car++)
		getDanger(car);
}


int Api_addPath(int srcX, int srcY, int dstX, int dstY) {
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
		memcpy(newPaths, api.paths, nextReserved * sizeof(Path));
		free(api.paths);
		api.paths = newPaths;
		api.path_reserved = nextReserved;

		i = api.path_reserved;
	}

	makePath:
	Path_make(&api.paths[i]);
	return i;
}

void Api_removePath(int id) {
	Path_destroy(&api.paths[id]);
}

