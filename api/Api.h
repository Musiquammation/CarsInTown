#pragma once
#include "cell_t.h"
#include <stdint.h>

#if PRINT_LOGS
#include <stdio.h>
#endif



typedef struct Api {
    struct Car* cars;
    struct Path* paths;
    cell_t* map;
    int cars_length;
    int cars_reserved;
    int path_reserved;
    int map_size;
} Api;

extern Api api;



cell_t* Api_init(int mapSize);
void Api_cleanup();
int* Api_reserveCars(int length);
void Api_getDangers();
int Api_addPath(int startDir, int srcX, int srcY, int dstX, int dstY);
void Api_removePath(int id);
void Api_setRoad(int idx, int road);