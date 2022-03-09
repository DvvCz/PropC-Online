import * as monaco from 'monaco-editor';
import * as FileSaver from 'file-saver';

import { getSetting, changeSetting, COMPILE_TYPING_TIMEOUT } from '../site/config';
import { compile, BlocklyPropResponse } from '../site/website';
import { writeLine, clear, btn_clear, btn_send, btn_download_bin, ta_compile_out, sl_type, in_intellisense } from '../site/page';
import { DownloadType, startConnecting, connection } from '../link/launcher';
import { getCompileResults } from '../ide/inspector';
import { loadStandardLibraries, CPPCompletionProvider } from '../ide/completion';
import { setupTabs, setTab, getSource, saveSources, setSource, current_file } from '../site/tabhandler';

import { tryCompile } from './source';

export const editor = monaco.editor.create(document.getElementById("container"), {
	value: getSource("main.c"),
	language: "cpp",
	theme: getSetting("theme")
});

const theme_selection = document.getElementById("sl_theme") as HTMLSelectElement;
theme_selection.addEventListener("change", function(evt: Event) {
	//@ts-ignore
	let theme: string = evt.target.value;
	monaco.editor.setTheme(theme);

	changeSetting("theme", theme);
});

monaco.editor.setTheme(getSetting("theme"));

monaco.languages.registerCompletionItemProvider("cpp", CPPCompletionProvider);

let current_timeout: number;
editor.onDidChangeModelContent(function() {
	if (current_timeout) {
		// Cancel old timeout, user is typing again.
		clearTimeout(current_timeout);
	}
	current_timeout = setTimeout(function() {
		tryCompile(function(http_success, resp) {
			if (http_success) {
				if (resp.success) {
					writeLine("Autosaved!");
					setSource( current_file, editor.getValue() );
					saveSources();
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
	}, COMPILE_TYPING_TIMEOUT);
});

export function startIDE() {
	btn_clear.addEventListener("click", function(evt) {
		clear();
	});

	// 'Send to Robot' button
	btn_send.addEventListener("click", function(evt) {
		tryCompile(function(http_success, resp) {
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

	// 'Download Binary' button
	btn_download_bin.addEventListener("click", function(evt) {
		tryCompile(function(http_success, resp) {
			if (http_success && resp.success) {
				let blob = new Blob([resp.binary], {type: "application/octet-stream"});
				FileSaver.saveAs(blob, `propc${resp.extension}`);
			}
		});
	});

	in_intellisense.addEventListener("click", function(evt) {
		if (in_intellisense.checked) {
			// Try and get functions from simpletools.h
			loadStandardLibraries();
		}
		changeSetting("intellisense", in_intellisense.checked);
	});

	sl_type.selectedIndex = getSetting("download_type") as number;
	sl_type.addEventListener("change", function(evt) {
		changeSetting("download_type", sl_type.selectedIndex);
	});
}