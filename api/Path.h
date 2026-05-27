#pragma once

#include "PathStep.h"
#include <stdbool.h>




typedef struct Path {
	PathStep* steps;
    int step;
	int length;
} Path;


bool Path_make(Path* path, int firstDir, int srcX, int srcY, int dstX, int dstY);
void Path_destroy(Path* path);
bool Path_isAlive(const Path* path);
