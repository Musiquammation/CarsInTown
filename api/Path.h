#pragma once

#include <stdbool.h>

typedef struct Path {
	int length;
} Path;


void Path_make(Path* path);
void Path_destroy(Path* path);
bool Path_isAlive(const Path* path);
