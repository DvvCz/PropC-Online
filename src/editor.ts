import * as monaco from 'monaco-editor';
import { PROPC_FDSERIAL_ENDPOINT, PROPC_SIMPLETEXT_ENDPOINT, PROPC_SIMPLETOOLS_ENDPOINT } from './config';

const CompletionItemKind = monaco.languages.CompletionItemKind;

const COMMENT_RGX = /\/\*(\*(?!\/)|[^*])*\*\//g;
const FUNC_RGX = /(extern )?(unsigned )?(int|void|long|char|float) \*?(\w+)\(([^)]*)\)/;
const VAR_RGX = /(extern )?(unsigned )?(\w+) \*?(\w+);/;
const DEFINE_RGX = /#define (\w+) (.+)/;

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

/// Load C++ / C definitions from a raw url to text.
/// It will do it's best to scan for functions and #defines and throw them at monaco for autocomplete.
function loadDefinitionsFrom(endpoint: string) {
	fetch(endpoint, {
		method: "GET"
	})
	.then(res => {
		res.text()
		.then(txt => {
			// Remove comments
			txt = txt.replace(COMMENT_RGX, "");

			const lines = txt.split("\n");
			for (const line of lines) {
				let def = line.match(DEFINE_RGX);
				if (def) {
					let name = def[1];
					let val = def[2];
					StdLib.push( createLibObject(name, CompletionItemKind.Constant, `Constant: ${val}`) )
				} else {
					let func = line.match(FUNC_RGX);
					if (func) {
						// Todo retvals
						let name = func[4];
						let params = func[5];
						StdLib.push( createLibObject(`${name}(${params})`, CompletionItemKind.Function, `Function: ${name} Takes ${params}`) )
					} else {
						let vars = line.match(VAR_RGX);
						if (vars) {
							let name = vars[4];
							StdLib.push( createLibObject(name, CompletionItemKind.Variable, `Variable: ${name}`) )
						}
					}
				}
			}
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
		const textUntilPosition = model.getValueInRange({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: position.lineNumber,
			endColumn: position.column
		});

		var match = textUntilPosition.match(
			/(\w+)\(/
		);

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

		return { suggestions: StdLib.map(x => { x.range = range; return x }) };
	}
}