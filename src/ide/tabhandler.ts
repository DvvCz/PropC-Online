import { ide_tabs } from "../site/page";
import { getSetting, changeSetting } from '../site/config';

// @ts-ignore
import ContextMenu from "@mturco/context-menu";
import { ide } from "..";
import { getDefaultValue } from "typedoc/dist/lib/utils/options/declaration";

export class TabHandler {
	tabs: Record<string, Tab>;
	current: Tab;

	// Backwards compatibility for when the IDE was just a single file.
	sources: Record<string, string> = getSetting("sources") || {
		["main.c"]: getSetting("code")
	};

	constructor() {
		this.tabs = {};
		this.current = this.addTab("main.c");

		const tabs = getSetting("tabs");
		if (tabs && tabs["main.c"]) {
			for (const name in tabs) {
				this.addTab(name);
			}
		} else {
			this.addTab("main.c");
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
			ide.tab_handler.addTab(name);
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
					const tab: Tab = tabs[elem.innerHTML]!;
					if (tab.name == "main.c") return;

					tab.close();
				},
			},
			{
				name: "Rename tab",
				fn: (elem: HTMLButtonElement) => {
					const tab: Tab = tabs[elem.innerHTML]!;
					if (tab.name == "main.c") return;
					if (tabs[tab.name]) {
						alert("File already exists!");
						return;
					}

					tab.rename("foo.c");
				}
			}
		], styling);
	}

	getSources(): Record<string, string> {
		return this.sources;
	}

	getSource(name: string): string {
		return this.sources[name] || "";
	}

	setSource(name: string, content: string) {
		if (this.current.name == name && ide.editor.getValue() != content) {
			// Be sure to use setValueSilent as to not cause a monaco editor model change feedback loop...
			ide.setValueSilent(content);
		}
	}

	saveSources() {
		changeSetting("sources", this.sources);
	}

	saveTabs() {
		changeSetting("tabs", this.encode());
	}

	closeTab(name: string) {
		const tab = this.tabs[name];
		if (!tab) return;

		tab.close();
	}

	setTab(name: string): boolean {
		const tab = this.tabs[name];
		if (!tab) return false;

		this.current.setSource( ide.editor.getValue() );
		this.saveSources();

		this.current = tab;

		let src = this.getSource(name);
		if (!src) {
			src = "// File " + name;
			this.setSource(name, src);
		}

		ide.setValueSilent(src);

		return true;
	}

	addTab(name: string): Tab {
		// Make sure a tab with that name doesn't already exist.
		if (this.tabs[name]) return this.tabs[name];

		const tab_elem = document.createElement("button");
		tab_elem.type = "button";
		tab_elem.innerHTML = name;
		tab_elem.className = "ide-tab";
		tab_elem.onclick = () => this.setTab(name);

		const tab = new Tab(name, tab_elem);
		this.tabs[name] = tab;
		this.saveTabs();

		// Make sure the tab doesn't go after the + button.
		ide_tabs.insertBefore(tab.elem, ide_tabs.childNodes[ ide_tabs.childElementCount ] );

		return tab;
	}

	encode(): string {
		return JSON.stringify( this.tabs );
	}
}

export class Tab {
	elem: HTMLButtonElement;
	name: string;

	constructor(name: string, elem: HTMLButtonElement) {
		this.elem = elem;
		this.name = name;
	}

	close() {
		ide_tabs.removeChild(this.elem);
		delete ide.tab_handler.tabs[this.name];
		ide.tab_handler.saveTabs();
	}

	rename(name: string) {
		ide.tab_handler.tabs[name] = ide.tab_handler.tabs[this.name];

		// Delete the actual tab object but not the HTML object.
		delete ide.tab_handler.tabs[this.name];
		ide.tab_handler.saveTabs();

		ide.tab_handler.setSource(name, ide.tab_handler.getSource(this.name));
		delete ide.tab_handler.sources[this.name];

		ide.tab_handler.saveSources();

		this.elem.innerHTML = name;
	}

	setSource(src: string) {
		ide.tab_handler.setSource(this.name, src);
	}

	getSource() {
		return ide.tab_handler.getSource(this.name);
	}
}