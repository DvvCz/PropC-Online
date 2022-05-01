import * as monaco from 'monaco-editor';
import * as FileSaver from 'file-saver';

import { getSetting, changeSetting, COMPILE_TYPING_TIMEOUT } from '../site/config';
import { compile, BlocklyPropResponse } from '../site/website';
import { writeLine, clear, btn_clear, btn_send, btn_download_bin, ta_compile_out, sl_type, in_intellisense } from '../site/page';
import { DownloadType, startConnecting, connection } from '../link/launcher';
import { getCompileResults } from '../ide/inspector';
import { loadStandardLibraries, CPPCompletionProvider } from '../ide/completion';
import { setupTabs, setTab, getSource, saveSources, setSource, current_file, tabs } from '../site/tabhandler';

import { editor } from './editor';

let current_compile: Promise<BlocklyPropResponse>;
let current_compile_timeout: number;

const INCLUDE_RGX = /#include\s*"([^"]+)"/g;
const NL = /\n/g;

/**
 * Get line numbers of each call to #include
 */
function getIncludeLines(code: string): Record<string, number> {
	let record: Record<string, number> = {};
	let match;
	while ((match = INCLUDE_RGX.exec(code)) !== null) {
		const filename = match[1];
		const before = code.substring(1, match.index);

		const lines = before.match(NL);
		if (lines) {
			record[filename] = lines.length + 1;
		} else {
			record[filename] = 0;
		}
	}

	return record;
}

// Replaces all instances of #include "tab.c" with the code from the tab.
function getPreprocessed(mainfile: string, included: Record<string, boolean> = {}): string {
	let code = getSource(mainfile);
	included[mainfile] = true;

	const lines = getIncludeLines(code);

	return code.replaceAll(INCLUDE_RGX, function(substr, filename) {
		// Already included, ignore.
		if (included[filename]) return "";
		if (!getSource(filename)) return substr; // File not found, regular C include?

		return `#line 1 "${filename}"
${ getPreprocessed(filename, included) }
#line ${ lines[filename] } "${mainfile}"`;
	});
}

export function tryCompile(ready?: (http_success: boolean, resp: BlocklyPropResponse) => void) {
	ready = ready || function() {};
	const code = getPreprocessed("main.c");
	console.log("Compiling:", code);

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
