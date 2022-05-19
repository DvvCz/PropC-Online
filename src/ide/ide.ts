import * as monaco from 'monaco-editor';

import { getSetting } from '../site/config';
import { div_container } from '../site/page';

export abstract class IDEPlugin {
	static load(editor: monaco.editor.IStandaloneCodeEditor) {}// (editor: monaco.editor.IStandaloneCodeEditor) => void;
	static postload(editor: monaco.editor.IStandaloneCodeEditor) {}//: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

import { ConfigPlugin } from './plugins/config';
import { ControlPlugin } from './plugins/control';
import { ThemePlugin } from './plugins/theme';
import { CompilePlugin } from './plugins/compile';
import { CompletionPlugin } from './plugins/completion';
import { tryCompile } from './source';
import { startConnecting } from '../link/launcher';
import { Console } from './console';
import { TabHandler } from './tabhandler';

export class IDE {
	public editor: monaco.editor.IStandaloneCodeEditor;
	public can_autosave: boolean = true;
	public set_source: boolean = false; // Whether the event was caused by a call to setSource
	public tab_handler: TabHandler;

	constructor() {
		this.tab_handler = new TabHandler(this);
		this.editor = monaco.editor.create(div_container, {
			value: this.tab_handler.getSource("main.c"),
			language: "cpp",
			theme: getSetting("theme")
		});

		CompilePlugin.load(this.editor);
		ConfigPlugin.load(this.editor);
		ControlPlugin.load(this.editor);
		ThemePlugin.load(this.editor);
		CompletionPlugin.load(this.editor);

		CompletionPlugin.postload(this.editor);
	}

	tryCompile = tryCompile
	startConnecting = startConnecting

	getValue = () => this.editor.getValue();

	save() {
		if (!this.can_autosave) { return }

		this.tab_handler.current.setSource(this.getValue());
		this.tab_handler.saveSources();
		Console.writeln("⏺️ Autosaved!");
	}

	setValue(value: string) {
		this.editor.setValue(value);
	}

	/// Sets the value of the monaco editor without any side-effects (e.g. causing a compile or autosave)
	setValueSilent(value: string) {
		const old = this.set_source;
		this.set_source = true;
		this.editor.setValue(value);
		this.set_source = old;
	}
}
