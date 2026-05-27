#include "Api.h"
#include "Path.h"
#include <stdbool.h>
#include <stdio.h>


int main() {
    Api_init(32);

    for (int x = 3; x < 10; x++)
        api.map[3 * 32 + x] = 1;

    for (int y = 3; y < 10; y++)
        api.map[y * 32 + 10] = 1;

    api.map[3 * 32 + 10] = 3 | (2<<4) | (3<<12);

    Path path;
    bool found = Path_make(&path, 0, 3, 3, 10, 7);
    printf("got %d\n", found);

    for (int i = 0; i < path.length; i++)
        printf("%d %d %d\n", path.steps[i].x, path.steps[i].y, path.steps[i].dir);

    return 0;
}