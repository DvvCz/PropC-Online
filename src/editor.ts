import * as monaco from 'monaco-editor';
import { PROPC_FDSERIAL_ENDPOINT, PROPC_SIMPLETEXT_ENDPOINT, PROPC_SIMPLETOOLS_ENDPOINT } from './config';
import { in_intellisense } from './page';

const CompletionItemKind = monaco.languages.CompletionItemKind;

const COMMENT_RGX = /\/\*(\*(?!\/)|[^*])*\*\//g;
const FUNC_RGX = /(extern\s+)?(unsigned\s+)?(fdserial|int\d*(?:_t)?|void|long|bool|char|float|terminal)\s+\*?(\w+)\(([^)]*)\)/;
const VAR_RGX = /(extern\s+)?(unsigned\s+)?(\w+)\s+\*?(\w+);/;
const DEFINE_RGX = /#define\s+(\w+)\s+(\S+)/;

let StdLib: any[] = [];

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

/// Load C++ / C definitions from a raw url to text.
/// It will do it's best to scan for functions and #defines and throw them at monaco for autocomplete.
function loadDefinitionsFrom(endpoint: string) {
	fetch(endpoint, {
		method: "GET"
	})
	.then(res => {
		res.text()
		.then(txt => {
			let defs = getDefinitionsFrom(txt);
			StdLib = StdLib.concat(defs);
		});
	})
	.catch(() => {
		throw `Could not fetch functions from ${endpoint}`
	});
}

export function loadStandardLibraries() {
	loadDefinitionsFrom(PROPC_SIMPLETOOLS_ENDPOINT);
	loadDefinitionsFrom(PROPC_SIMPLETEXT_ENDPOINT);
	loadDefinitionsFrom(PROPC_FDSERIAL_ENDPOINT);
}

export const CPPCompletionProvider = {
	provideCompletionItems: function (model: monaco.editor.IReadOnlyModel, position: monaco.Position): monaco.languages.CompletionList {
		if (!in_intellisense.checked) { return null; }

		const textUntilPosition = model.getValueInRange({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: position.lineNumber,
			endColumn: position.column
		});

		var match = textUntilPosition.match(/(\w+)\(/);

		if (!match) {
			// @ts-ignore
			return { suggestions: [] };
		}

		var word = model.getWordUntilPosition(position);

		// @ts-ignore
		var range: monaco.Range = {
			startLineNumber: position.lineNumber,
			endLineNumber: position.lineNumber,
			startColumn: word.startColumn,
			endColumn: word.endColumn
		};

		console.log("Getting completions...");

		let code = model.getValue();

		let code_defs = getDefinitionsFrom(code);

		let total_defs = StdLib.concat(code_defs);
		total_defs.forEach( x => x.range = range );

		return { suggestions: total_defs };
	}
};
