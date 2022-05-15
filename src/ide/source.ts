import * as monaco from 'monaco-editor';

import { compile, BlocklyPropResponse } from '../site/website';
import { Console } from '../ide/console';
import { getSource } from '../ide/tabhandler';

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
	console.log("Compiling:", code.length, code);

	if (current_compile) {
		Console.writeln("❌ Already compiling!");

		current_compile_timeout = setTimeout(function() {
			// Just in case the compile is never heard from.
			current_compile = null;
			current_compile_timeout = null;

			Console.writeln("⏲️ Compile timed out...");
		}, 2000);
		return;
	}

	// Clear errors / warnings, new compile.
	let model = monaco.editor.getModels()[0];
	monaco.editor.setModelMarkers(model, "owner", []);

	Console.write("💻 Compiling... ");

	current_compile = compile(code);

	current_compile
		.then(resp => {
			if (resp.success) {
				Console.writeln(`✔️ ${resp['compiler-output']}`)
			} else {
				Console.error(`Failed: ${resp['compiler-error']}`)
			}
			ready(true, resp);
		})
		.catch(reason => {
			Console.error(`Failed: ${reason}`);
			ready(false, reason);
		})
		.finally(() => {
			current_compile = null;

			if (current_compile_timeout) {
				clearTimeout(current_compile_timeout);
			}
		});
}
