import { road_t } from "./road_t";
import { RoadType } from "./roadtypes";

export namespace roadfn {
    export function getType(road: road_t) {
        return (road & 0x7) as RoadType;
    }

    export function setType(type: RoadType) {
        return (type & 0x7) as road_t;
    }
}