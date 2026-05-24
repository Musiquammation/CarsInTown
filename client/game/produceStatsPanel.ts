import { MapConstructor } from "./MapConstructor"
import { CarColor } from "./CarColor"
import { GAME_COLORS } from "../handler/GAME_COLORS";
import { turnSideSelector } from "./TurnSideSelector";



export function produceStatsPanel(map: MapConstructor) {
    const panel = document.createElement('div');
    panel.classList.add('statsPanel');
    panel.classList.add('shown');
    
	const table = document.createElement("table");
	const head = document.createElement("thead");
	const headRow = document.createElement("tr");

	for (const headerText of ["(x,y)", "rythm", "score", "color"]) {
		const th = document.createElement("th");
		th.textContent = headerText;
		headRow.appendChild(th);
	}

	head.appendChild(headRow);
	table.appendChild(head);

	const body = document.createElement("tbody");

    const sortedSpawners = [...map.carSpawners].sort((a, b) => {
        if (a.score !== b.score) {
            return b.score - a.score;
        }
        return a.color - b.color;
    });

    for (const spawner of sortedSpawners) {		const row = document.createElement("tr");
        row.dataset.color = spawner.color.toString();

		if (spawner.color === CarColor.WHITE) {
			row.style.color = "#000";
		}

		const xy = document.createElement("td");
		xy.textContent = `(${spawner.x},${spawner.y})`;
		row.appendChild(xy);

		const rhythm = document.createElement("td");
		rhythm.textContent = String(spawner.rythm);
		row.appendChild(rhythm);

		const score = document.createElement("td");
		score.textContent = `+${spawner.score}`;
		row.appendChild(score);

		const color = document.createElement("td");
		color.textContent = CarColor[spawner.color] || String(spawner.color);
		row.appendChild(color);

		body.appendChild(row);
	}

    table.appendChild(body);



    const button = document.createElement('button');
    button.addEventListener('click', () => {
        panel.classList.toggle('shown');
    });


	const container = document.createElement("div");
	container.appendChild(turnSideSelector.getHtmlDiv())
	container.appendChild(table);
	
    panel.appendChild(button);
	panel.appendChild(container);

    return panel;
}