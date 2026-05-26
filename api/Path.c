#include <stddef.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include "Path.h"
#include "Api.h"
#include "cell_t.h"

enum {
    VOID      = 0,
    ROAD      = 1,
    TARGET    = 2,
    DIRECTION = 3,
    YIELD     = 4,
    LIGHT     = 5,
};

/* ── bit-field helpers ─────────────────────────────────────── */

#define CELL_TYPE(c)          ((c) & 0xF)          /* bits [3:0]   */

/* ROAD */
#define ROAD_WEIGHT(c)        (((c) >> 8) & 0xFF)  /* bits [15:8]  */

/* DIRECTION */
#define DIR_FIRST_SIDE(c)     (((c) >> 4) & 0x7)   /* bits [6:4]   */
#define DIR_SECOND_SIDE(c)    (((c) >> 7) & 0x7)   /* bits [9:7]   */
#define DIR_FIRST_DIR(c)      (((c) >> 10) & 0x3)  /* bits [11:10] */
#define DIR_SECOND_DIR(c)     (((c) >> 12) & 0x3)  /* bits [13:12] */

/* direction constants */
#define D_RIGHT  0
#define D_UP     1
#define D_LEFT   2
#define D_BOTTOM 3

/* dx/dy per direction */
static const int DX[4] = { 1,  0, -1,  0 };
static const int DY[4] = { 0, -1,  0,  1 };

/* ── cost helpers ──────────────────────────────────────────── */

static float evalCost(int weight) {
	return 1.0f; /* constant for now */
}

static float nonRoadCost_cached = -1.0f;

static float getNonRoadCost(void) {
	if (nonRoadCost_cached < 0.0f)
		nonRoadCost_cached = evalCost(40);
	return nonRoadCost_cached;
}

/* ── direction helpers ─────────────────────────────────────── */

/*
 * Turn a relative side-flag into a list of absolute directions,
 * given the current absolute direction `facing`.
 *
 * Relative semantics (from the spec):
 *   1 = front          → same direction
 *   2 = right          → turn right  (facing + 3) % 4   [clockwise]
 *   3 = left           → turn left   (facing + 1) % 4
 *   4 = front + right
 *   5 = front + left
 *   6 = left  + right
 *   7 = all (front + right + left)
 *
 * "right" and "left" are relative to the direction of travel:
 *   facing RIGHT(0): relative-right = DOWN(3), relative-left = UP(1)
 *   facing UP(1):    relative-right = RIGHT(0), relative-left = LEFT(2)
 *   facing LEFT(2):  relative-right = UP(1),    relative-left = DOWN(3)
 *   facing BOTTOM(3):relative-right = LEFT(2),  relative-left = RIGHT(0)
 *
 *   general: right = (facing + 3) % 4,  left = (facing + 1) % 4
 *
 * Returns a bitmask of absolute directions (bit 0=RIGHT … bit 3=BOTTOM).
 */
static int sideToAbsDirMask(int side, int facing) {
	if (side == 0) return 0;

	int front = facing;
	int right = (facing + 3) % 4;
	int left  = (facing + 1) % 4;

	int mask = 0;
	if (side & 1) mask |= (1 << front);  /* front bit */
	if (side & 2) mask |= (1 << right);  /* right bit */
	if (side & 4) mask |= (1 << left);   /* left  bit */
	/* side values decoded:
	   1 = 001 → front
	   2 = 010 → right
	   3 = 011 → front + right
	   4 = 100 → left
	   5 = 101 → front + left
	   6 = 110 → right + left
	   7 = 111 → all                                          */
	return mask;
}

/* ── A* state ──────────────────────────────────────────────── */

typedef struct {
	float g;        /* cost from start        */
	float f;        /* g + heuristic          */
	int   x, y;
	int   dir;      /* direction when arriving here */
	int   parent;   /* index in closed list, -1 = none */
} ANode;

/* min-heap of ANode* ordered by f */
typedef struct {
	ANode **data;
	int     size;
	int     cap;
} Heap;

static bool heap_push(Heap *h, ANode *n) {
	if (h->size == h->cap) {
		int newcap = h->cap ? h->cap * 2 : 64;
		ANode **nd = realloc(h->data, newcap * sizeof *h->data);
		if (!nd) return false;
		h->data = nd;
		h->cap  = newcap;
	}
	/* bubble up */
	int i = h->size++;
	h->data[i] = n;
	while (i > 0) {
		int parent = (i - 1) / 2;
		if (h->data[parent]->f <= h->data[i]->f) break;
		ANode *tmp = h->data[parent];
		h->data[parent] = h->data[i];
		h->data[i] = tmp;
		i = parent;
	}
	return true;
}

static ANode *heap_pop(Heap *h) {
	if (!h->size) return NULL;
	ANode *top = h->data[0];
	h->data[0] = h->data[--h->size];
	/* bubble down */
	int i = 0;
	for (;;) {
		int l = 2*i+1, r = 2*i+2, best = i;
		if (l < h->size && h->data[l]->f < h->data[best]->f) best = l;
		if (r < h->size && h->data[r]->f < h->data[best]->f) best = r;
		if (best == i) break;
		ANode *tmp = h->data[i];
		h->data[i] = h->data[best];
		h->data[best] = tmp;
		i = best;
	}
	return top;
}

/* ── visited table: best g per (x, y, dir) ────────────────── */

static inline int visited_idx(int x, int y, int dir, int size) {
	return (y * size + x) * 4 + dir;
}

/* ── path reconstruction ───────────────────────────────────── */

/*
 * Walk the closed list back from `last_idx` and build the Step array.
 * We only record steps where the direction changes
 * (plus the very first and very last step).
 */
static bool reconstruct(Path *path, ANode **closed, int last_idx) {
	/* count nodes in chain */
	int count = 0;
	for (int i = last_idx; i >= 0; i = closed[i]->parent)
		count++;

	/* collect in reverse */
	int *chain = malloc(count * sizeof(int));
	if (!chain) return false;
	{
		int k = count - 1;
		for (int i = last_idx; i >= 0; i = closed[i]->parent)
			chain[k--] = i;
	}

	/* count how many steps we really need
	   (direction changes + mandatory first & last) */
	int nsteps = 0;
	for (int k = 0; k < count; k++) {
		if (k == 0 || k == count - 1)
			nsteps++;
		else if (closed[chain[k]]->dir != closed[chain[k-1]]->dir)
			nsteps++;
	}

	path->steps = malloc(nsteps * sizeof(Step));
	if (!path->steps) { free(chain); return false; }
	path->length = nsteps;

	int s = 0;
	for (int k = 0; k < count; k++) {
		bool keep = (k == 0 || k == count - 1)
				 || (closed[chain[k]]->dir != closed[chain[k-1]]->dir);
		if (keep) {
			path->steps[s].x   = closed[chain[k]]->x;
			path->steps[s].y   = closed[chain[k]]->y;
			path->steps[s].dir = closed[chain[k]]->dir;
			s++;
		}
	}

	free(chain);
	return true;
}

/* ── main pathfinding function ─────────────────────────────── */

bool Path_make(Path *path, int startDir, int srcX, int srcY, int dstX, int dstY) {
	path->steps  = NULL;
	path->length = 0;

	int size = api.map_size;

	/* best-g visited table: one float per (x, y, dir) triplet */
	float *best = malloc(size * size * 4 * sizeof(float));
	if (!best) return false;
	for (int i = 0; i < size * size * 4; i++)
		best[i] = 1e30f;

	/* closed list – all settled nodes, stored for path reconstruction */
	int    closed_cap = 256;
	ANode **closed    = malloc(closed_cap * sizeof(ANode*));
	if (!closed) { free(best); return false; }
	int closed_size = 0;

	/* open heap */
	Heap open = { NULL, 0, 0 };

	/* seed */
	ANode *start = malloc(sizeof(ANode));
	if (!start) { free(best); free(closed); return false; }
	start->g      = 0.0f;
	start->f      = (float)(abs(dstX - srcX) + abs(dstY - srcY));
	start->x      = srcX;
	start->y      = srcY;
	start->dir    = startDir;
	start->parent = -1;
	heap_push(&open, start);
	best[visited_idx(srcX, srcY, startDir, size)] = 0.0f;

	bool found = false;

	while (open.size > 0) {
		ANode *cur = heap_pop(&open);

		/* add to closed list */
		if (closed_size == closed_cap) {
			closed_cap *= 2;
			ANode **nc = realloc(closed, closed_cap * sizeof(ANode*));
			if (!nc) goto cleanup;
			closed = nc;
		}
		int cur_idx = closed_size;
		closed[closed_size++] = cur;

		/* goal check */
		if (cur->x == dstX && cur->y == dstY) {
			found = reconstruct(path, closed, cur_idx);
			goto cleanup;
		}

		cell_t cell = api.map[cur->y * size + cur->x];
		int    type = CELL_TYPE(cell);

		/*
		 * Determine which directions we can leave this cell towards.
		 *
		 * Rules:
		 *  - VOID : impassable – should not be here, skip
		 *  - ROAD, TARGET, YIELD, LIGHT : can only continue straight (cur->dir)
		 *  - DIRECTION : apply side rules for the matching dir entries
		 */

		int dir_mask = 0; /* bitmask of outgoing absolute directions */

		if (type == VOID) {
			/* should not have expanded a VOID cell; skip */
			continue;
		} else if (type == DIRECTION) {
			/*
			 * Check first and second (dir, side) pairs.
			 * If our current direction matches a stored dir,
			 * apply its side to get outgoing directions.
			 * If neither matches, we can only go straight.
			 */
			int first_dir  = DIR_FIRST_DIR(cell);
			int second_dir = DIR_SECOND_DIR(cell);
			int first_side  = DIR_FIRST_SIDE(cell);
			int second_side = DIR_SECOND_SIDE(cell);

			bool matched = false;
			if (first_side  != 0 && first_dir  == cur->dir) {
				dir_mask |= sideToAbsDirMask(first_side,  cur->dir);
				matched = true;
			}
			if (second_side != 0 && second_dir == cur->dir) {
				dir_mask |= sideToAbsDirMask(second_side, cur->dir);
				matched = true;
			}
			if (!matched) {
				/* no entry for our direction: go straight */
				dir_mask = (1 << cur->dir);
			}
		} else {
			/* ROAD, TARGET, YIELD, LIGHT: straight only */
			dir_mask = (1 << cur->dir);
		}

		/* expand each allowed direction */
		for (int d = 0; d < 4; d++) {
			if (!(dir_mask & (1 << d))) continue;

			int nx = cur->x + DX[d];
			int ny = cur->y + DY[d];
			if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;

			cell_t ncell = api.map[ny * size + nx];
			int    ntype = CELL_TYPE(ncell);

			/* VOID is impassable */
			if (ntype == VOID) continue;

			/* cost to enter neighbour */
			float step_cost;
			if (ntype == ROAD)
				step_cost = evalCost((int)ROAD_WEIGHT(ncell));
			else
				step_cost = getNonRoadCost();

			float ng = cur->g + step_cost;

			int vi = visited_idx(nx, ny, d, size);
			if (ng >= best[vi]) continue; /* already found a better path */
			best[vi] = ng;

			ANode *nb = malloc(sizeof(ANode));
			if (!nb) goto cleanup;
			nb->g      = ng;
			nb->f      = ng + (float)(abs(dstX - nx) + abs(dstY - ny));
			nb->x      = nx;
			nb->y      = ny;
			nb->dir    = d;
			nb->parent = cur_idx;
			heap_push(&open, nb);
		}
	}

cleanup:
	/* free open-heap nodes that were never settled */
	for (int i = 0; i < open.size; i++)
		free(open.data[i]);
	free(open.data);

	/* free closed list nodes (steps array owns the result; nodes are expendable) */
	for (int i = 0; i < closed_size; i++)
		free(closed[i]);
	free(closed);

	free(best);
	return found;
}

/* ── Path_destroy / Path_isAlive ───────────────────────────── */

void Path_destroy(Path *path) {
	free(path->steps);
	path->steps  = NULL;
	path->length = 0;
}

bool Path_isAlive(const Path *path) {
	return path->steps != NULL;
}