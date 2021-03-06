/*
	Compile code as you type
*/

import * as monaco from "monaco-editor";

import { COMPILE_TYPING_TIMEOUT } from "../../site/config";
import { IDEPlugin } from "../ide";
import { getCompileResults } from "../inspector";
import { tryCompile } from "../source";
import { ide } from "../..";

let current_timeout: number | null;
function onContentChanged(editor: monaco.editor.IStandaloneCodeEditor) {
	if (ide.set_source) { return }

	if (current_timeout) {
		// Cancel old timeout, user is typing again.
		clearTimeout(current_timeout);
	}
	current_timeout = setTimeout(() => {
		// Autosave even if it didn't compile correctly.
		ide.save();

		tryCompile((http_success, resp) => {
			if (http_success) {
				if (!resp.success) {
					// Extract warnings / errors to display in editor
					const results = getCompileResults( resp['compiler-error'] ).map(x => {
						return {
							startLineNumber: x.line,
							endLineNumber: x.line,

							startColumn: x.char,
							endColumn: x.end_char,

							message: x.msg,
							severity: x.type == "warning" ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error
						}
					});

					let model = monaco.editor.getModels()[0];
					monaco.editor.setModelMarkers(model, "owner", results);
				}
			}
		});

		current_timeout = null;
	}, COMPILE_TYPING_TIMEOUT);
}

export class CompilePlugin implements IDEPlugin {
	static load(editor: monaco.editor.IStandaloneCodeEditor) {
		editor.onDidChangeModelContent( () => onContentChanged(editor) );
	}
}