import { ide_tabs } from "./page";

let tabs = {};
let tab_idx = 0;

class Tab {
    id: number;
    elem: HTMLButtonElement;

    constructor(id: number, elem: HTMLButtonElement) {
        this.id = id;
        this.elem = elem;
    }
}

export function setTab(name: string) {
    let tab = tabs[name];
    let element = ide_tabs.childNodes;
}

// Remove tab and shift others id's down
export function closeTab(name: string) {
    let toremove = tabs[name];
    ide_tabs.removeChild(toremove.elem);

    for (const tab in tabs) {
        if (tab.id > toremove.id) {
            tab.id--;
        }
    }
}

export function addTab(name: string) {
    const tab = document.createElement("button");
    tab.className = "ide-tab";
    tab.onclick = function() {
        setTab(name);
    };

    tab_idx++;
    tabs[name] = new Tab(tab_idx, name);
    ide_tabs.append(tab);
}

addTab("main.c");

// 			<button class="ide-tab active" onclick="setTab(event, 'main.c')">main.c</button>