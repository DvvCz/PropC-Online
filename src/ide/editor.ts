import * as monaco from 'monaco-editor';

import { getSetting } from '../site/config';
import { getSource } from '../ide/tabhandler';

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

export class IDE {
	public editor: monaco.editor.IStandaloneCodeEditor;

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
}
