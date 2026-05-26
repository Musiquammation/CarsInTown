#include "Api.h"
#include "Car.h"
#include "cell_t.h"
#include "getDanger.h"
#include <stdlib.h>

Api api;

cell_t* Api_init(int mapSize) {	
	api.map = calloc(mapSize*mapSize, sizeof(cell_t));
	api.cars = (Car*)malloc(sizeof(Car) * api.reserved);
	api.length = 0;
	api.reserved = 16;
	api.size = mapSize;

	return api.map;
}

void Api_cleanup() {
	free(api.cars);
	free(api.map);
}

int* Api_reserveCars(int length) {
	if (length > api.reserved) {
		api.reserved = length * 2;
		free(api.cars);
		api.cars = (Car*)malloc(sizeof(Car) * api.reserved);
	}

	api.length = length;
	return (int*)api.cars;
}

void Api_getDangers() {
	const Car* end = api.cars + api.length;
	for (Car* car = api.cars; car < end; car++)
		getDanger(car);
}