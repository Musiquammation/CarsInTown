import { MapConstructor } from "./MapConstructor"

export function produceStatsPanel(map: MapConstructor) {
    const panel = document.createElement('div');
    
	panel.textContent = "No data...";

    return panel;
}