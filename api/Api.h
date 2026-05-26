#pragma once
#include "cell_t.h"
#include <stdint.h>

#ifdef USE_WASM
#include <emscripten/emscripten.h>
#define EMCC_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EMCC_EXPORT
#endif


typedef struct Api {
    struct Car* cars;
    cell_t* map;
    int length;
    int reserved;
    int size;
} Api;

extern Api api;

EMCC_EXPORT
cell_t* Api_init(int mapSize);

EMCC_EXPORT
void Api_cleanup();

EMCC_EXPORT
int* Api_reserveCars(int length);

EMCC_EXPORT
void Api_getDangers();