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

static cell_t cellAt(int x, int y) {
	if (x < 0 || y < 0 || x >= api.map_size || y >= api.map_size)
		return 0;
	return api.map[y * api.map_size + x];
}


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
	int front = facing;
	int right = (facing + 3) % 4;
	int left  = (facing + 1) % 4;

	switch (side) {
		case 0: return 0;
		case 1: return (1 << front);
		case 2: return (1 << right);
		case 3: return (1 << left);
		case 4: return (1 << front) | (1 << right);
		case 5: return (1 << front) | (1 << left);
		case 6: return (1 << left)  | (1 << right);
		case 7: return (1 << front) | (1 << right) | (1 << left);
		default: return 0;
	}
}


/* ── A* node ───────────────────────────────────────────────── */

typedef struct {
	float g;        /* cost from start                   */
	float f;        /* g + heuristic                     */
	int   x, y;
	int   dir;      /* direction when arriving at (x,y)  */
	int   parent;   /* index in closed list, -1 = none   */
} ANode;


/* ── static persistent buffers (allocated in Path_setup) ───── */

/* best g-cost per (x, y, dir) state */
static float  *s_best        = NULL;

/* closed list: array of ANode values (not pointers) */
static ANode  *s_closed      = NULL;
static int     s_closed_cap  = 0;

/* node pool: pre-allocated ANode objects reused each call */
static ANode  *s_pool        = NULL;
static int     s_pool_cap    = 0;
static int     s_pool_used   = 0;

/* open heap: array of pointers into s_pool */
static ANode **s_heap_data   = NULL;
static int     s_heap_cap    = 0;

/* chain buffer used in reconstruct() */
static int    *s_chain       = NULL;
static int     s_chain_cap   = 0;


/* ── helpers to grow static buffers ────────────────────────── */

static bool ensure_closed(int needed) {
	if (needed <= s_closed_cap)
		return true;
	int newcap = s_closed_cap ? s_closed_cap * 2 : 256;
	while (newcap < needed) newcap *= 2;
	ANode *nd = realloc(s_closed, newcap * sizeof(ANode));
	if (!nd) return false;
	s_closed     = nd;
	s_closed_cap = newcap;
	return true;
}

static bool ensure_pool(int needed) {
	if (needed <= s_pool_cap)
		return true;
	int newcap = s_pool_cap ? s_pool_cap * 2 : 256;
	while (newcap < needed) newcap *= 2;
	ANode *nd = realloc(s_pool, newcap * sizeof(ANode));
	if (!nd) return false;
	s_pool     = nd;
	s_pool_cap = newcap;
	return true;
}

static bool ensure_heap(int needed) {
	if (needed <= s_heap_cap)
		return true;
	int newcap = s_heap_cap ? s_heap_cap * 2 : 256;
	while (newcap < needed) newcap *= 2;
	ANode **nd = realloc(s_heap_data, newcap * sizeof(ANode *));
	if (!nd) return false;
	s_heap_data = nd;
	s_heap_cap  = newcap;
	return true;
}

static bool ensure_chain(int needed) {
	if (needed <= s_chain_cap)
		return true;
	int newcap = s_chain_cap ? s_chain_cap * 2 : 256;
	while (newcap < needed) newcap *= 2;
	int *nd = realloc(s_chain, newcap * sizeof(int));
	if (!nd) return false;
	s_chain     = nd;
	s_chain_cap = newcap;
	return true;
}


/* ── node pool alloc ───────────────────────────────────────── */

static ANode *pool_alloc(void) {
	if (!ensure_pool(s_pool_used + 1))
		return NULL;
	return &s_pool[s_pool_used++];
}


/* ── min-heap ordered by f (operates on s_heap_data) ──────── */

typedef struct {
	int size;
} Heap;

static bool heap_push(Heap *h, ANode *n) {
	if (!ensure_heap(h->size + 1))
		return false;
	int i = h->size++;
	s_heap_data[i] = n;
	while (i > 0) {
		int p = (i - 1) / 2;
		if (s_heap_data[p]->f <= s_heap_data[i]->f) break;
		ANode *tmp       = s_heap_data[p];
		s_heap_data[p]   = s_heap_data[i];
		s_heap_data[i]   = tmp;
		i = p;
	}
	return true;
}

static ANode *heap_pop(Heap *h) {
	if (!h->size) return NULL;
	ANode *top     = s_heap_data[0];
	s_heap_data[0] = s_heap_data[--h->size];
	int i = 0;
	for (;;) {
		int l = 2*i+1, r = 2*i+2, best = i;
		if (l < h->size && s_heap_data[l]->f < s_heap_data[best]->f) best = l;
		if (r < h->size && s_heap_data[r]->f < s_heap_data[best]->f) best = r;
		if (best == i) break;
		ANode *tmp        = s_heap_data[i];
		s_heap_data[i]    = s_heap_data[best];
		s_heap_data[best] = tmp;
		i = best;
	}
	return top;
}


/* ── visited index: (x, y, dir) → flat index ──────────────── */

static inline int visited_idx(int x, int y, int dir, int size) {
	return (y * size + x) * 4 + dir;
}


/* ── Path_setup / Path_cleanup ─────────────────────────────── */

void Path_setup(void) {
	int size    = api.map_size;
	int states  = size * size * 4;

	/* best-cost table: one float per (x,y,dir) state */
	s_best = malloc(states * sizeof(float));

	/* initial capacities proportional to map area */
	int area = size * size;

	s_closed_cap = area;
	s_closed     = malloc(s_closed_cap * sizeof(ANode));

	s_pool_cap   = area;
	s_pool       = malloc(s_pool_cap   * sizeof(ANode));

	s_heap_cap   = area;
	s_heap_data  = malloc(s_heap_cap   * sizeof(ANode *));

	s_chain_cap  = area;
	s_chain      = malloc(s_chain_cap  * sizeof(int));

	nonRoadCost_cached = -1.0f;
}

void Path_cleanup(void) {
	free(s_best);       s_best       = NULL;
	free(s_closed);     s_closed     = NULL;
	free(s_pool);       s_pool       = NULL;
	free(s_heap_data);  s_heap_data  = NULL;
	free(s_chain);      s_chain      = NULL;

	s_closed_cap = s_pool_cap = s_heap_cap = s_chain_cap = 0;
}


/* ── path reconstruction ───────────────────────────────────── */

/*
 * Walk the closed list back from last_idx and build path->steps.
 * Records direction-change waypoints, the departure, and the arrival.
 */
static bool reconstruct(Path *path, int last_idx, int dstX, int dstY) {
	/* count nodes in chain */
	int count = 0;
	for (int i = last_idx; i >= 0; i = s_closed[i].parent)
		count++;

	/* store chain indices in forward order using s_chain */
	if (!ensure_chain(count)) return false;
	{
		int k = count - 1;
		for (int i = last_idx; i >= 0; i = s_closed[i].parent)
			s_chain[k--] = i;
	}

	/* count steps to allocate */
	int nsteps = 0;
	for (int k = 0; k < count; k++) {
		if (k == 0 || k == count - 1)
			nsteps++;
		else if (s_closed[s_chain[k]].dir != s_closed[s_chain[k-1]].dir)
			nsteps++;
	}

	/* path->steps is the only malloc we keep per Path_make call */
	path->steps = malloc(nsteps * sizeof(PathStep));
	if (!path->steps) return false;
	path->length = nsteps;

	int s = 0;
	for (int k = 0; k < count; k++) {
		if (k == count - 1) {
			path->steps[s].x   = dstX;
			path->steps[s].y   = dstY;
			path->steps[s].dir = -1;
			s++;
		} else if (k == 0) {
			path->steps[s].x   = s_closed[s_chain[k]].x;
			path->steps[s].y   = s_closed[s_chain[k]].y;
			path->steps[s].dir = s_closed[s_chain[k]].dir;
			s++;
		} else if (s_closed[s_chain[k]].dir != s_closed[s_chain[k-1]].dir) {
			/* direction changes: record the cell where the turn happens (k-1)
			 * with the new outgoing direction (k) */
			path->steps[s].x   = s_closed[s_chain[k-1]].x;
			path->steps[s].y   = s_closed[s_chain[k-1]].y;
			path->steps[s].dir = s_closed[s_chain[k]].dir;
			s++;
		}
	}

	return true;
}


/* ── Path_make ─────────────────────────────────────────────── */

bool Path_make(Path *path, int startDir, int srcX, int srcY, int dstX, int dstY) {
	path->steps  = NULL;
	path->length = 0;
	path->step   = 0;

	int size   = api.map_size;
	int states = size * size * 4;

	/* reset best-cost table */
	for (int i = 0; i < states; i++)
		s_best[i] = 1e30f;

	/* reset pool and closed list */
	s_pool_used  = 0;
	int closed_size = 0;

	/* open set: min-heap, size tracked locally */
	Heap open = { 0 };

	/* seed the start node from the pool */
	ANode *start = pool_alloc();
	if (!start) return false;
	start->g      = 0.0f;
	start->f      = (float)(abs(dstX - srcX) + abs(dstY - srcY));
	start->x      = srcX;
	start->y      = srcY;
	start->dir    = startDir;
	start->parent = -1;
	heap_push(&open, start);
	s_best[visited_idx(srcX, srcY, startDir, size)] = 0.0f;

	bool found = false;

	while (open.size > 0) {
		ANode *cur = heap_pop(&open);

		/* settle: copy into closed list (values, not pointers) */
		if (!ensure_closed(closed_size + 1)) return false;
		int cur_idx = closed_size;
		s_closed[closed_size++] = *cur;

		/* goal check */
		if (cur->x == dstX && cur->y == dstY) {
			found = reconstruct(path, cur_idx, dstX, dstY);
			return found;
		}

		cell_t cell = cellAt(cur->x, cur->y);
		int    type = CELL_TYPE(cell);

		if (type == CELL_VOID)
			continue;

		/*
		 * Determine allowed outgoing directions from this cell.
		 *
		 *   VOID            : impassable, skip
		 *   ROAD / TARGET
		 *   YIELD / LIGHT   : straight only — direction cannot change here
		 *   DIRECTION       : apply side rules for matching dir entries;
		 *                     if no entry matches current direction, go straight
		 */
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

			cell_t ncell = cellAt(nx, ny);
			int    ntype = CELL_TYPE(ncell);

			if (ntype == CELL_VOID) continue;

			float step_cost = (ntype == CELL_ROAD)
				? evalCost((int)ROAD_WEIGHT(ncell))
				: getNonRoadCost();

			float ng = s_closed[cur_idx].g + step_cost;

			int vi = visited_idx(nx, ny, d, size);
			if (vi < 0 || vi >= states) continue;
			if (ng >= s_best[vi]) continue;
			s_best[vi] = ng;

			ANode *nb = pool_alloc();
			if (!nb) return false;
			nb->g      = ng;
			nb->f      = ng + (float)(abs(dstX - nx) + abs(dstY - ny));
			nb->x      = nx;
			nb->y      = ny;
			nb->dir    = d;
			nb->parent = cur_idx;
			heap_push(&open, nb);
		}
	}

	return false;
}


/* ── Path_destroy / Path_isAlive ───────────────────────────── */

void Path_destroy(Path *path) {
	free(path->steps);
	path->steps = NULL;
}

bool Path_isAlive(const Path *path) {
	return path->steps != NULL;
}
