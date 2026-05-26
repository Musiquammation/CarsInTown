#include "Path.h"

void Path_make(Path *path, int srcX, int srcY, int dstX, int dstY) {
    /// TODO: Path_make
    path->length = 1;
}



void Path_destroy(Path *path) {
    path->length = 0; // mark as destroyed
}


bool Path_isAlive(const Path *path) {
    return path->length > 0;
}

