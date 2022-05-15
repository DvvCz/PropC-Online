import * as monaco from 'monaco-editor';
import { IDEPlugin } from '../editor';

import { getSetting, SIMPLELIBS_REPO } from '../../site/config';
import { in_intellisense, writeLine } from '../../site/page';
import { getSource, tabs } from '../../ide/tabhandler';

const CompletionItemKind = monaco.languages.CompletionItemKind;

const COMMENT_RGX = /\/\*(\*(?!\/)|[^*])*\*\//g;
const FUNC_RGX = /(extern\s+)?(unsigned\s+)?(fdserial|int\d*(?:_t)?|void|long|bool|char|float|terminal)\s+\*?(\w+)\(([^)]*)\)/;
const VAR_RGX = /(extern\s+)?(unsigned\s+)?(\w+)\s+\*?(\w+);/;
const DEFINE_RGX = /#define\s+(\w+)\s+(\S+)/;

function createLibObject(name: string, kind: monaco.languages.CompletionItemKind, desc: string): monaco.languages.CompletionItem {
	return {
		label: name,
		kind: kind,
		documentation: desc,
		insertText: name,

		// Will be set later
		range: null
	}
}

function getDefinitionsFrom(code: string): monaco.languages.CompletionItem[] {
	code = code.replace(COMMENT_RGX, "");

	const out = [];
	const lines = code.split("\n");
	for (const line of lines) {
		let def = line.match(DEFINE_RGX);
		if (def) {
			let name = def[1];
			let val = def[2];
			out.push( createLibObject(name, CompletionItemKind.Constant, `Constant: ${val}`) )
		} else {
			let func = line.match(FUNC_RGX);
			if (func) {
				// Todo retvals
				let name = func[4];
				let params = func[5];
				out.push( createLibObject(`${name}(${params})`, CompletionItemKind.Function, `Function: ${name} Takes ${params}`) )
			} else {
				let vars = line.match(VAR_RGX);
				if (vars) {
					let name = vars[4];
					out.push( createLibObject(name, CompletionItemKind.Variable, `Variable: ${name}`) )
				}
			}
		}
	}
	return out;
}

const Definitions: Record<string, monaco.languages.CompletionItem[]> = {};

const INCLUDEHEADER_RGX = /#include\s+"([^"]+.h)"/;

function scanHeaderIncludes(code: string, callback: (header: string)=>void) {
	const lines = code.split("\n");
	for (const line of lines) {
		const inc = line.match(INCLUDEHEADER_RGX);
		if (inc) {
			callback(inc[1]);
		}
	}
}

/// Load C++ / C definitions from a raw url to text.
/// It will do it's best to scan for functions and #defines and throw them at monaco for autocomplete.
function loadDefinitionsFrom(endpoint: string) {
	const filename = endpoint.split("/").pop();
	fetch(endpoint, {
		method: "GET"
	})
	.then(res => {
		res.text()
		.then(txt => {
			const defs = getDefinitionsFrom(txt);
			Definitions[filename] = defs;
		});
	})
	.catch(() => {
		throw `Could not fetch functions from ${endpoint}`
	});
}

/**
 * Like loadDefinitionsFrom but helps with finding the file path.
 * @param folder Folder inside of SIMPLELIBS_REPO
 * @param file File inside of /lib<file>/<file>.h
 */
function loadDef(folder: string, file: string) {
	loadDefinitionsFrom(`${SIMPLELIBS_REPO}${folder}/lib${file}/${file}.h`);
}

export function loadStandardLibraries() {
	// Utility/libsimpletools/simpletools.h
	loadDef("Utility", "simpletools")
	loadDef("TextDevices", "fdserial");
	loadDef("TextDevices", "simpletext");
	loadDef("Utility", "colormath");
	loadDef("Audio", "text2speech");
	loadDef("Audio", "sound");
	loadDef("Sensor", "ping");
	loadDef("Time", "datetime");
}

const CPPCompletionProvider = {
	provideCompletionItems: function (model: monaco.editor.IReadOnlyModel, position: monaco.Position): monaco.languages.CompletionList {
		if (!in_intellisense.checked) { return null; }

		const textUntilPosition = model.getValueInRange({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: position.lineNumber,
			endColumn: position.column
		});

		const match = textUntilPosition.match(/(\w+)\(/);

		if (!match) {
			// @ts-ignore
			return { suggestions: [] };
		}

		const word = model.getWordUntilPosition(position);

		// @ts-ignore
		const range: monaco.Range = {
			startLineNumber: position.lineNumber,
			endLineNumber: position.lineNumber,
			startColumn: word.startColumn,
			endColumn: word.endColumn
		};

		console.log("Getting completions...");

		let defs: monaco.languages.CompletionItem[] = [];

		const code = model.getValue();
		scanHeaderIncludes(code, header => {
			if (Definitions[header]) {
				defs = defs.concat( Definitions[header] );
			}
		});

		for (const name in tabs) {
			const code = getSource(name);
			defs = defs.concat( getDefinitionsFrom(code) );
		}

		defs.forEach( x => x.range = range );

		return { suggestions: defs };
	}
};

export class CompletionPlugin implements IDEPlugin {
	static load(editor: monaco.editor.IStandaloneCodeEditor) {
		monaco.languages.registerCompletionItemProvider("cpp", CPPCompletionProvider);
	}

	static postload(editor: monaco.editor.IStandaloneCodeEditor) {
		if (getSetting("intellisense")) {
			loadStandardLibraries();
		}
	}
}