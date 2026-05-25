export class Target {
    x: number;
    y: number;
    directions: Target[] = [];
    private step = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
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