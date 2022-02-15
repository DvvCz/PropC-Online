import * as monaco from 'monaco-editor';
import * as cookie from 'js-cookie';

import * as config from './config';
import { compile, BlocklyPropResponse } from './website';
import { writeLine, clear, btn_clear, btn_download, ta_compile_out, sl_type, in_intellisense } from './page';
import { DownloadType, startConnecting, connection } from './launcher';
import { getCompileResults } from './inspector';
import { loadStandardLibraries, CPPCompletionProvider } from './editor';

let current_compile: Promise<BlocklyPropResponse>;

const editor = monaco.editor.create(document.getElementById("container"), {
	value: localStorage.getItem("propc_code") || config.DEFAULT_CODE,
	language: "cpp",
	theme: "vs-dark"
});

monaco.languages.registerCompletionItemProvider("cpp", CPPCompletionProvider);

let current_timeout: number;
editor.onDidChangeModelContent(function() {
	if (current_timeout) {
		// Cancel old timeout, user is typing again.
		clearTimeout(current_timeout);
	}
	current_timeout = setTimeout(function() {
		try_compile(editor.getValue(), function(http_success, resp) {
			if (http_success) {
				if (resp.success) {
					writeLine("Autosaved!");
					localStorage.setItem("propc_code", editor.getValue());
				} else {
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
	}, config.COMPILE_TYPING_TIMEOUT);
});

const theme_selection = document.getElementById("sl_theme") as HTMLSelectElement;
theme_selection.addEventListener('change', function(evt) {
	// @ts-ignore
	monaco.editor.setTheme(evt.target.value);
});

let current_compile_timeout: number;

function try_compile(code: string, ready?: (http_success: boolean, resp: BlocklyPropResponse) => void) {
	ready = ready || function() {};

	if (current_compile) {
		writeLine("Already compiling!")

		current_compile_timeout = setTimeout(function() {
			// Just in case the compile is never heard from.
			current_compile = null;
			current_compile_timeout = null;

			writeLine("Compile timed out...");
		}, 2000);
		return;
	}

	// Clear errors / warnings, new compile.
	let model = monaco.editor.getModels()[0];
	monaco.editor.setModelMarkers(model, "owner", []);

	ta_compile_out.value = "Compiling... ";

	current_compile = compile(code);

	current_compile
		.then(resp => {
			if (resp.success) {
				writeLine(resp['compiler-output'])
			} else {
				writeLine(`Failed: ${resp['compiler-error']}`)
			}
			ready(true, resp);
		})
		.catch(reason => {
			ta_compile_out.innerText = `Failed to compile: ${reason}`;
			ready(false, reason);
		})
		.finally(() => {
			current_compile = null;

			if (current_compile_timeout) {
				clearTimeout(current_compile_timeout);
			}
		});
}

btn_clear.addEventListener("click", function(evt) {
	clear();
});

// 'Download' button
btn_download.addEventListener("click", function(evt) {
	try_compile(editor.getValue(), function(http_success, resp) {
		if (http_success && resp.success) {
			if (connection) {
				const selected = sl_type.options[sl_type.selectedIndex];
				const dl_type = (selected ? selected.value : "EEPROM") as DownloadType;
				connection.downloadCode(resp.binary, resp.extension, dl_type);
			} else {
				writeLine("Download: Failed, no connection established with BlocklyPropLauncher");
			}
		}
	});
});

in_intellisense.addEventListener("click", function(evt) {
	if (in_intellisense.checked) {
		// Try and get functions from simpletools.h
		loadStandardLibraries();
	}
});

startConnecting();

try_compile(editor.getValue());