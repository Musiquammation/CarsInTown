import { Car } from "./Car";
import { GameMap } from "./GameMap";

export function getDanger(
    car: Car,
    DISTANCE: number,
    cmap: GameMap
) {
    return {
        speedLimit: 0,
        acceleration: 0
    }
}