#pragma once

#include <stdint.h>


typedef struct Car {
	int32_t x;
	int32_t y;
	float step;
	float speed;
	float speedLimit;
	int32_t direction;
	int32_t pathfindingId;
	int32_t action; // 0: front, 1: right, 2: left
	int32_t id;
	float out_acc;
	float out_speedLimit;
} Car;