#pragma once

#include <stdbool.h>


typedef struct Step {
    int x;
    int y;
    int dir;
} Step;

typedef struct Path {
	Step* steps;
	int length;
} Path;


bool Path_make(Path* path, int firstDir, int srcX, int srcY, int dstX, int dstY);
void Path_destroy(Path* path);
bool Path_isAlive(const Path* path);
