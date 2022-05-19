import { ide_tabs } from "../site/page";
import { getSetting, changeSetting } from '../site/config';
import { ide } from "../index";

// @ts-ignore
import ContextMenu from "@mturco/context-menu";

export const tabs: Record<string, Tab> = {};

export let current_file: string = "main.c";

// Backwards compatibility for when the IDE was just a single file.
export const sources: Record<string, string> = getSetting("sources") || {
	["main.c"]: getSetting("code")
};

// Have to check if it exists or not because of JS / TS importing in the wrong order....
export function getSources(): Record<string, string> {
	return sources;
}

export function saveSources() {
	changeSetting("sources", sources);
}

export function getSource(source: string): string {
	return sources[source] || "";
}

export function setSource(source: string, content: string) {
	getSources()[source] = content;

	if (current_file == source && ide.editor.getValue() != content) {
		// Be sure to set ide variables as to not cause a monaco editor model change feedback loop...
		ide.can_autosave = false;
		ide.set_source = true;

		ide.setValueSilent(content);

		ide.set_source = false;
		ide.can_autosave = true;
	}
}

class Tab {
	elem: HTMLButtonElement;
	name: string;

	constructor(name: string, elem: HTMLButtonElement) {
		this.elem = elem;
		this.name = name;
	}
}

export function setTab(name: string) {
	const tab = tabs[name];
	if (!tab) { return false }

	setSource( current_file, ide.editor.getValue() );
	saveSources();

	current_file = name;

	let src = getSource(name);
	if (!src) {
		src = "// File " + name;
		setSource(name, src);
	}

	ide.setValueSilent(src);

	return true;
}

// Remove tab and shift others id's down
export function closeTab(name: string) {
	const toremove = tabs[name];
	if (toremove) {
		ide_tabs.removeChild(toremove.elem);
		delete tabs[name];
		changeSetting("tabs", tabs);
	}
}

export function addTab(name: string) {
	// Make sure a tab with that name doesn't already exist.
	if (tabs[name]) return;

	const tab = document.createElement("button");
	tab.type = "button";
	tab.innerHTML = name;
	tab.className = "ide-tab";
	tab.onclick = function() {
		setTab(name);
	};

	tabs[name] = new Tab(name, tab);
	changeSetting("tabs", tabs);

	// Make sure the tab doesn't go after the + button.
	ide_tabs.insertBefore( tab, ide_tabs.childNodes[ ide_tabs.childElementCount ] );
}

export function setupTabs() {
	let tabs = getSetting("tabs");

	if (tabs && tabs["main.c"]) {
		for (let name in tabs) {
			addTab(name);
		}
	} else {
		addTab("main.c");
	}

	let count = 0;
	const tab_add = document.getElementById("btn_add_tab") as HTMLButtonElement;
	tab_add.onclick = function() {
		// Find next available name slot
		let name;
		do {
			name = `file${count}.c`;
			count++;
		} while( tabs[name] )
		addTab(name);
	}

	tab_add.oncontextmenu = function(e) {
		e.preventDefault();
	}

	const styling = {
		className: "contextmenu",
		minimalStyling: true
	};

	new ContextMenu(".ide-tab", [
		{
			name: "Close tab",
			fn: (elem: HTMLButtonElement) => {
				if (elem.innerHTML == "main.c") return;

				//const tab = tabs[elem.innerHTML];
				closeTab(elem.innerHTML);
			},
		}
	], styling);
}