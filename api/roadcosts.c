#include "roadconsts.h"


static const float MAX_SPEED = 1.1f;
static const float GAMMA = 9.0f;

static int opti_max = -1;
static int opti_zero = -1;


static int evalRoadConst(float x) {
    static const float INV_GAMMA = 1/GAMMA;
    static const float M = (1-INV_GAMMA) / MAX_SPEED;
    
    float y = M * x + INV_GAMMA;
    return (int)(y*125);
}

int getRoadCost(float speed) {
    if (speed >= MAX_SPEED) {
        if (opti_max >= 0) {return opti_max;}
        opti_max = evalRoadConst(MAX_SPEED);
        return opti_max;
    }

    if (speed <= 0.0f) {
        if (opti_zero >= 0) {return opti_zero;}
        opti_zero = evalRoadConst(0);
        return opti_zero;
    }

    return evalRoadConst(speed);
}



int getPathCost(int cost) {
    if (cost == 0) {return opti_zero;}
    if (cost < 0) {return 2*opti_zero;}
    return cost;
}
