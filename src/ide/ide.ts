import * as monaco from 'monaco-editor';

import { getSetting } from '../site/config';
import { current_file, getSource, saveSources, setSource } from './tabhandler';

export abstract class IDEPlugin {
	static load(editor: monaco.editor.IStandaloneCodeEditor) {}// (editor: monaco.editor.IStandaloneCodeEditor) => void;
	static postload(editor: monaco.editor.IStandaloneCodeEditor) {}//: (editor: monaco.editor.IStandaloneCodeEditor) => void;
}

import { ConfigPlugin } from './plugins/config';
import { ControlPlugin } from './plugins/control';
import { ThemePlugin } from './plugins/theme';
import { CompilePlugin } from './plugins/compile';
import { CompletionPlugin } from './plugins/completion';
import { setupTabs } from './tabhandler';
import { tryCompile } from './source';
import { startConnecting } from '../link/launcher';
import { Console } from './console';

export class IDE {
	public editor: monaco.editor.IStandaloneCodeEditor;
	public can_autosave: boolean = true;
	public set_source: boolean = false; // Whether the event was caused by a call to setSource

	constructor() {
		this.editor = monaco.editor.create(document.getElementById("container"), {
			value: getSource("main.c"),
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

	setupTabs = setupTabs
	tryCompile = tryCompile
	startConnecting = startConnecting

	getValue = () => this.editor.getValue();

	save() {
		if (!this.can_autosave) { return }

		setSource(current_file, this.getValue());
		saveSources();
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
