import * as monaco from 'monaco-editor';
import { IDEPlugin } from '../ide';

import { getSetting, SIMPLELIBS_REPO } from '../../site/config';
import { in_intellisense } from '../../site/page';
import { getSource, tabs } from '../../ide/tabhandler';

const CompletionItemKind = monaco.languages.CompletionItemKind;

const COMMENT_RGX = /\/\*(\*(?!\/)|[^*])*\*\//g;
const FUNC_RGX = /((?:extern|inline)\s+)?(unsigned\s+)?(fdserial|u?int\d*(?:_t)?|void|long|bool|char|float|terminal)\s*\*?(\w+)\(([^)]*)\)/;
const VAR_RGX = /(extern\s+)?(unsigned\s+)?(\w+)\s+\*?(\w+);/;
const LVAR_RGX = /(unsigned\s+)?(\w+)\s+\*?(\w+)\s+=/;
const DEFINE_RGX = /#define\s+(\w+)\s+(\S+)/;
const STRUCT_RGX = /struct\s+(\w+)\s*{/;

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

const KEYWORDS: string[] = [
	"while", "for",
	"do", "else", "if", "switch", "case", "default",

	"inline", "extern",

	"auto", "const", "unsigned", "signed",

	"float", "double", "bool", "char", "int", "long", "short", "void",

	"break", "return", "continue", "goto",
	"enum", "union", "struct", "typedef",

	"sizeof"
];

const BASE_DEFINITIONS: monaco.languages.CompletionItem[] = [];
for (const kw of KEYWORDS) {
	BASE_DEFINITIONS.push( createLibObject(kw, CompletionItemKind.Keyword, `Keyword: ${kw}`) );
}

BASE_DEFINITIONS.push({
	label: "while",
	kind: CompletionItemKind.Snippet,
	documentation: "while loop",
	insertText: "while (true) {\n\t${0}\n}",
	range: null
});

BASE_DEFINITIONS.push({
	label: "for",
	kind: CompletionItemKind.Snippet,
	documentation: "for loop",
	insertText: "for (int i = 0; i < 10; i++) {\n\t${0}\n}",
	range: null
});

BASE_DEFINITIONS.push({
	label: "if",
	kind: CompletionItemKind.Snippet,
	documentation: "if condition",
	insertText: "if (true) {\n\t${0}\n}",
	range: null
});

function getDefinitionsFrom(code: string): monaco.languages.CompletionItem[] {
	code = code.replace(COMMENT_RGX, "");

	const out = [];
	const lines = code.split("\n");
	for (const line of lines) {
		const def = line.match(DEFINE_RGX);
		if (def) {
			const name = def[1];
			const val = def[2];
			out.push( createLibObject(name, CompletionItemKind.Constant, `Constant: ${val}`) )
		} else {
			const func = line.match(FUNC_RGX);
			if (func) {
				// Todo retvals
				const name = func[4];
				const params = func[5];
				out.push( createLibObject(`${name}(${params})`, CompletionItemKind.Function, `Function: ${name} Takes ${params}`) )
			} else {
				const vardecls = line.match(VAR_RGX);
				if (vardecls) {
					const name = vardecls[4];
					out.push( createLibObject(name, CompletionItemKind.Variable, `Variable Declaration: ${name}`) )
				} else {
					const vardefs = line.match(LVAR_RGX);
					if (vardefs) {
						const name = vardefs[3];
						out.push( createLibObject(name, CompletionItemKind.Variable, `Variable Definition: ${name}`) )
					} else {
						const struct = line.match(STRUCT_RGX);
						if (struct) {
							const name = struct[1];
							out.push( createLibObject(name, CompletionItemKind.Struct, `Struct: ${name}`) )
						}
					}
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
	loadDef("Remote", "libsirc");
}

const CPPCompletionProvider = {
	provideCompletionItems: function (model: monaco.editor.IReadOnlyModel, position: monaco.Position): monaco.languages.CompletionList | undefined {
		if (!in_intellisense.checked) { return; }

		const textUntilPosition = model.getValueInRange({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: position.lineNumber,
			endColumn: position.column
		});

		const match = textUntilPosition.match(/(\w+)\(/);

		if (!match) {
			return;
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

		let defs: monaco.languages.CompletionItem[] = [...BASE_DEFINITIONS];

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