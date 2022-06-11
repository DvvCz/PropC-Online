import * as monaco from "monaco-editor";

import { compile, BlocklyPropResponse } from '../site/website';
import { Console } from '../ide/console';
import { getSource } from '../ide/tabhandler';
import * as util from '../util';

interface CurrentCompile {
	response: Promise<BlocklyPropResponse> | null,
	timeout: number | null,
	in_progress: boolean,

	code_hash: number,
	binary_out: string
}

let current_compile: CurrentCompile = {
	response: null,
	in_progress: false,
	timeout: null,

	code_hash: -1,
	binary_out: ""
};

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

	return code.replaceAll(INCLUDE_RGX, (substr, filename) => {
		// Already included, ignore.
		if (included[filename]) return "";
		if (!getSource(filename)) return substr; // File not found, regular C include?

		return `#line 1 "${filename}"
${ getPreprocessed(filename, included) }
#line ${ lines[filename] } "${mainfile}"`;
	});
}

export function tryCompile(ready: (http_success: boolean, resp: BlocklyPropResponse) => void = function() {}) {
	const code = getPreprocessed("main.c");

	if (current_compile.in_progress) {
		Console.writeln("❌ Already compiling!");

		current_compile.timeout = setTimeout(() => {
			// Just in case the compile is never heard from.
			current_compile.in_progress = false;
			current_compile.timeout = null;
			current_compile.response = null;

			Console.writeln("⏲️ Compile timed out...");
		}, 2000);
		return;
	}

	// Clear errors / warnings, new compile.
	let model = monaco.editor.getModels()[0];
	monaco.editor.setModelMarkers(model, "owner", []);

	Console.write("💻 Compiling... ");
	if (code.length < 5) { return Console.error("Failed: Code too small to compile") }

	const code_hash = util.cyrb53(code);
	if (current_compile.code_hash == code_hash) {
		Console.writeln(`✔️ Cached`);
		ready(true, {
			success: true,
			binary: current_compile.binary_out,
			"compiler-output": "Compiled",
			"compiler-error": "",
			extension: ".elf"
		});
		return;
	}

	current_compile.in_progress = true;
	current_compile.response = compile(code);

	current_compile
		.response
		.then(resp => {
			if (resp.success) {
				current_compile.binary_out = resp.binary;
				current_compile.code_hash = code_hash;

				Console.writeln(`✔️ ${resp['compiler-output']}`)
			} else {
				current_compile.binary_out = "";
				current_compile.code_hash = -1;
				Console.error(`Failed: ${resp['compiler-error']}`)
			}
			ready(true, resp);
		})
		.catch(reason => {
			Console.error(`Failed: ${reason}`);
			ready(false, reason);
		})
		.finally(() => {
			current_compile.in_progress = false;

			if (current_compile.timeout) {
				clearTimeout(current_compile.timeout);
			}
		});
}
