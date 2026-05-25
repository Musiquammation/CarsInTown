const DIRECTIONS = [
    { value: 0, label: "RIGHT" },
    { value: 1, label: "UP" },
    { value: 2, label: "LEFT" },
    { value: 3, label: "DOWN" },
] as const;

export class LightSelector {
    parent: HTMLElement;
    private callback: ((data: number | null) => void) | null = null;
    private currentBits = 0;
    private isMouseDown = false;
    private paintValue = false;

    constructor(parent: HTMLElement) {
        this.parent = parent;

        this.parent.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        this.parent.querySelector("#ls-ok")!
            .addEventListener("click", () => this.confirm());
        this.parent.querySelector("#ls-cancel")!
            .addEventListener("click", () => this.cancel());

        document.addEventListener("mouseup", () => { this.isMouseDown = false; });
    }

    take(data: number, callback: (data: number | null) => void): void {
        // Décoder les deux champs depuis data
        this.currentBits = (data >> 4) & 0xFF;
        const direction  = (data >> 12) & 0x3;
        this.callback = callback;
        this.parent.classList.remove("hidden");
        this.buildUI(this.currentBits, direction);
    }

    private buildUI(bits: number, direction: number): void {
        // --- Dots ---
        const container = this.parent.querySelector(".ls-dots") as HTMLElement;
        container.innerHTML = "";

        for (let i = 0; i < 8; i++) {
            const dot = document.createElement("div");
            dot.className = "ls-dot";
            dot.dataset.index = String(i);
            dot.classList.toggle("ls-dot--on", (bits >> i & 1) === 1);

            dot.addEventListener("mousedown", (e) => {
                e.preventDefault();
                this.isMouseDown = true;
                this.paintValue = !dot.classList.contains("ls-dot--on");
                this.applyDot(dot, i);
            });

            dot.addEventListener("mouseenter", () => {
                if (!this.isMouseDown) return;
                this.applyDot(dot, i);
            });

            container.appendChild(dot);
        }

        // --- Select ---
        const select = this.parent.querySelector("#ls-direction") as HTMLSelectElement;
        select.innerHTML = "";
        for (const d of DIRECTIONS) {
            const opt = document.createElement("option");
            opt.value = String(d.value);
            opt.textContent = d.label;
            opt.selected = d.value === direction;
            select.appendChild(opt);
        }
    }

    private applyDot(dot: HTMLElement, index: number): void {
        dot.classList.toggle("ls-dot--on", this.paintValue);
        if (this.paintValue) {
            this.currentBits |= 1 << index;
        } else {
            this.currentBits &= ~(1 << index);
        }
    }

    private confirm(): void {
        const select = this.parent.querySelector("#ls-direction") as HTMLSelectElement;
        const direction = parseInt(select.value);
        const result = (this.currentBits << 4) | (direction << 12);
        this.close(result);
    }

    private cancel(): void {
        this.close(null);
    }

    private close(result: number | null): void {
        this.parent.classList.add("hidden");
        if (this.callback) {
            this.callback(result);
            this.callback = null;
        }
    }
}

export const lightSelector = new LightSelector(
    document.getElementById("lightSelector")!
);