#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include "Path.h"
#include "Api.h"
#include "PathStep.h"
#include "cell_t.h"


#include "CellTypeEnum.h"

/* ── bit-field helpers ─────────────────────────────────────── */

#define CELL_TYPE(c)          ((c) & 0xF)
#define ROAD_WEIGHT(c)        (((c) >> 8) & 0xFF)
#define DIR_FIRST_SIDE(c)     (((c) >> 4) & 0x7)
#define DIR_SECOND_SIDE(c)    (((c) >> 7) & 0x7)
#define DIR_FIRST_DIR(c)      (((c) >> 10) & 0x3)
#define DIR_SECOND_DIR(c)     (((c) >> 12) & 0x3)

#define D_RIGHT  0
#define D_UP     1
#define D_LEFT   2
#define D_BOTTOM 3

static const int DX[4] = {  1,  0, -1,  0 };
static const int DY[4] = {  0, -1,  0,  1 };

/* ── cost helpers ──────────────────────────────────────────── */

static float evalCost(int weight) {
	(void)weight;
	return 1.0f;
}

static float nonRoadCost_cached = -1.0f;

static float getNonRoadCost(void) {
	if (nonRoadCost_cached < 0.0f)
		nonRoadCost_cached = evalCost(40);
	return nonRoadCost_cached;
}

/* ── direction helpers ─────────────────────────────────────── */

/*
 * Convert a relative side value into a bitmask of absolute directions,
 * given the current facing direction.
 *
 * Side bit layout:
 *   bit 0 = front  → same as facing
 *   bit 1 = right  → (facing + 3) % 4   (clockwise)
 *   bit 2 = left   → (facing + 1) % 4   (counter-clockwise)
 *
 * Side values from spec:
 *   0 = nothing
 *   1 = front
 *   2 = right
 *   3 = front + right
 *   4 = left
 *   5 = front + left
 *   6 = right + left
 *   7 = all
 */
static int sideToAbsDirMask(int side, int facing) {
	if (side == 0) return 0;
	int mask = 0;
	if (side & 1) mask |= (1 << facing);               /* front */
	if (side & 2) mask |= (1 << ((facing + 3) % 4));   /* right */
	if (side & 4) mask |= (1 << ((facing + 1) % 4));   /* left  */
	return mask;
}

/* ── A* node ───────────────────────────────────────────────── */

typedef struct {
	float g;        /* cost from start                    */
	float f;        /* g + heuristic                      */
	int   x, y;
	int   dir;      /* direction when arriving at (x, y)  */
	int   parent;   /* index in closed list, -1 = none    */
} ANode;

/* ── min-heap ordered by f ─────────────────────────────────── */

typedef struct {
	ANode **data;
	int     size;
	int     cap;
} Heap;

static bool heap_push(Heap *h, ANode *n) {
	if (h->size == h->cap) {
		int newcap = h->cap ? h->cap * 2 : 64;
		ANode **nd = realloc(h->data, newcap * sizeof(ANode*));
		if (!nd) return false;
		h->data = nd;
		h->cap  = newcap;
	}
	int i = h->size++;
	h->data[i] = n;
	while (i > 0) {
		int p = (i - 1) / 2;
		if (h->data[p]->f <= h->data[i]->f) break;
		ANode *tmp  = h->data[p];
		h->data[p]  = h->data[i];
		h->data[i]  = tmp;
		i = p;
	}
	return true;
}

static ANode *heap_pop(Heap *h) {
	if (!h->size) return NULL;
	ANode *top  = h->data[0];
	h->data[0]  = h->data[--h->size];
	int i = 0;
	for (;;) {
		int l = 2*i+1, r = 2*i+2, best = i;
		if (l < h->size && h->data[l]->f < h->data[best]->f) best = l;
		if (r < h->size && h->data[r]->f < h->data[best]->f) best = r;
		if (best == i) break;
		ANode *tmp      = h->data[i];
		h->data[i]      = h->data[best];
		h->data[best]   = tmp;
		i = best;
	}
	return top;
}

/* ── visited index: (x, y, dir) → flat index ──────────────── */

static inline int visited_idx(int x, int y, int dir, int size) {
	return (y * size + x) * 4 + dir;
}

/* ── path reconstruction ───────────────────────────────────── */

/*
 * Walk the closed list back from last_idx and build path->steps.
 * Only records steps where the direction changes, plus:
 *   - the first step  (departure)
 *   - the last step   (arrival, forced to dstX/dstY with dir = -1)
 */
static bool reconstruct(Path *path, ANode **closed, int last_idx,
						 int dstX, int dstY) {
	/* count nodes in chain */
	int count = 0;
	for (int i = last_idx; i >= 0; i = closed[i]->parent)
		count++;

	/* store chain indices in forward order */
	int *chain = malloc(count * sizeof(int));
	if (!chain) return false;
	{
		int k = count - 1;
		for (int i = last_idx; i >= 0; i = closed[i]->parent)
			chain[k--] = i;
	}

	/* count how many steps to allocate */
	int nsteps = 0;
	for (int k = 0; k < count; k++) {
		if (k == 0 || k == count - 1)
			nsteps++;
		else if (closed[chain[k]]->dir != closed[chain[k-1]]->dir)
			nsteps++;
	}

	path->steps = malloc(nsteps * sizeof(PathStep));
	if (!path->steps) { free(chain); return false; }
	path->length = nsteps;

	int s = 0;
	for (int k = 0; k < count; k++) {
		if (k == count - 1) {
			path->steps[s].x   = dstX;
			path->steps[s].y   = dstY;
			path->steps[s].dir = -1;
			s++;
		} else if (k == 0) {
			path->steps[s].x   = closed[chain[k]]->x;
			path->steps[s].y   = closed[chain[k]]->y;
			path->steps[s].dir = closed[chain[k]]->dir;
			s++;
		} else if (closed[chain[k]]->dir != closed[chain[k-1]]->dir) {
			/* direction changes: record the cell where the turn happens (k-1)
			with the new outgoing direction (k) */
			path->steps[s].x   = closed[chain[k-1]]->x;
			path->steps[s].y   = closed[chain[k-1]]->y;
			path->steps[s].dir = closed[chain[k]]->dir;
			s++;
		}
	}

	free(chain);
	return true;
}

/* ── Path_make ─────────────────────────────────────────────── */

bool Path_make(Path *path, int startDir, int srcX, int srcY, int dstX, int dstY) {
	path->steps  = NULL;
	path->length = 0;
	path->step = 0;

	int size = api.map_size;

	/* best g-cost reached per (x, y, dir) state */
	float *best = malloc(size * size * 4 * sizeof(float));
	if (!best) return false;
	for (int i = 0; i < size * size * 4; i++)
		best[i] = 1e30f;

	/* closed list: settled nodes kept for path reconstruction */
	int     closed_cap  = 256;
	ANode **closed      = malloc(closed_cap * sizeof(ANode*));
	if (!closed) { free(best); return false; }
	int closed_size = 0;

	/* open set: min-heap on f */
	Heap open = { NULL, 0, 0 };

	/* seed the start node */
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

		/* settle: add to closed list */
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
			found = reconstruct(path, closed, cur_idx, dstX, dstY);
			goto cleanup;
		}

		cell_t cell = api.map[cur->y * size + cur->x];
		int    type = CELL_TYPE(cell);

		/*
		 * Determine allowed outgoing directions from this cell.
		 *
		 *   VOID            : impassable, skip (should not have been enqueued)
		 *   ROAD / TARGET
		 *   YIELD / LIGHT   : straight only — direction cannot change here
		 *   DIRECTION       : apply side rules for the matching dir entries;
		 *                     if no entry matches our current direction, go straight
		 */
		if (type == CELL_VOID)
			continue;

		int dir_mask = 0;

		if (type == CELL_DIRECTION) {
			int first_side  = DIR_FIRST_SIDE(cell);
			int second_side = DIR_SECOND_SIDE(cell);
			int first_dir   = DIR_FIRST_DIR(cell);
			int second_dir  = DIR_SECOND_DIR(cell);

			bool matched = false;
			if (first_side  != 0 && first_dir  == cur->dir) {
				dir_mask |= sideToAbsDirMask(first_side,  cur->dir);
				matched = true;
			}
			if (second_side != 0 && second_dir == cur->dir) {
				dir_mask |= sideToAbsDirMask(second_side, cur->dir);
				matched = true;
			}
			if (!matched)
				dir_mask = (1 << cur->dir); /* no rule for us: go straight */
		} else {
			dir_mask = (1 << cur->dir); /* ROAD, TARGET, YIELD, LIGHT: straight */
		}

		/* expand each allowed outgoing direction */
		for (int d = 0; d < 4; d++) {
			if (!(dir_mask & (1 << d))) continue;

			int nx = cur->x + DX[d];
			int ny = cur->y + DY[d];
			if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;

			cell_t ncell = api.map[ny * size + nx];
			int    ntype = CELL_TYPE(ncell);

			if (ntype == CELL_VOID) continue; /* impassable */

			float step_cost = (ntype == CELL_ROAD)
				? evalCost((int)ROAD_WEIGHT(ncell))
				: getNonRoadCost();

			float ng = cur->g + step_cost;

			int vi = visited_idx(nx, ny, d, size);
			if (ng >= best[vi]) continue; /* a better path already exists */
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
	for (int i = 0; i < open.size; i++)
		free(open.data[i]);
	free(open.data);

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
}

bool Path_isAlive(const Path *path) {
	return path->steps != NULL;
}