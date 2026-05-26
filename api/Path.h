#pragma once

#include <stdbool.h>

typedef struct Path {
	int length;
} Path;


void Path_make(Path* path, int srcX, int srcY, int dstX, int dstY);
void Path_destroy(Path* path);
bool Path_isAlive(const Path* path);
