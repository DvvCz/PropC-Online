/*
	Compile code as you type
*/

import * as monaco from "monaco-editor";
import { COMPILE_TYPING_TIMEOUT } from "../../site/config";
import { Console } from "../../ide/console";
import { current_file, saveSources, setSource } from "../../ide/tabhandler";
import { IDEPlugin } from "../editor";
import { getCompileResults } from "../inspector";
import { tryCompile } from "../source";

let current_timeout: number;
function onContentChanged(editor: monaco.editor.IStandaloneCodeEditor) {
	if (current_timeout) {
		// Cancel old timeout, user is typing again.
		clearTimeout(current_timeout);
	}
	current_timeout = setTimeout(function() {
		// Autosave even if it didn't compile correctly.
		setSource(current_file, editor.getValue());
		saveSources();
		Console.writeln("⏺️ Autosaved!");

		tryCompile(function(http_success, resp) {
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
		editor.onDidChangeModelContent(function() {
			onContentChanged(editor);
		});
	}
}