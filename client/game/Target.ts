interface Point {
    x: number;
    y: number;
}

export class Target {
    private readonly directions: Point[];
    private step = 0;

    constructor(directions: Point[]) {
        this.directions = directions;
    }

    take() {
        const p = this.directions[this.step];
        this.step++;
        if (this.step >= this.directions.length) {
            this.step -= this.directions.length;
        }

        return p;
    }

    reset() {
        this.step = 0;
    }
}