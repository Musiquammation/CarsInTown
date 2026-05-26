#include "getDanger.h"
#include "Car.h"


void getDanger(Car* car) {
    car->out_acc = 0;
    car->out_speedLimit = 0.3f;
}