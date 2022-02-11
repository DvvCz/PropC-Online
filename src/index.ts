import * as monaco from 'monaco-editor';
import * as cookie from 'js-cookie';

import * as config from './config';
import { compile, BlocklyPropResponse } from './website';
import { writeLine, btn_clear, btn_download, ta_compile_out, sl_type } from './page';
import { LauncherConnection, DownloadType } from './launcher';
import { getCompileResults } from './inspector';

let connection: LauncherConnection;
let current_compile: Promise<BlocklyPropResponse>;

const editor = monaco.editor.create(document.getElementById('container'), {
	value: config.DEFAULT_CODE,
	language: 'cpp',
	theme: 'vs-dark'
});

let current_timeout: number;
editor.onDidChangeModelContent(function(evt) {
	if (current_timeout) {
		// Cancel old timeout, user is typing again.
		clearTimeout(current_timeout);
	}
	current_timeout = setTimeout(function() {
		try_compile(editor.getValue(), function(http_success, resp) {
			if (http_success && !resp.success) {
				const results = getCompileResults( resp['compiler-error'] ).map(x => {
					return {
						startLineNumber: x.line,
						endLineNumber: x.line,

						startColumn: x.char,
						endColumn: x.char,

						message: x.msg,
						severity: x.type == "warning" ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error
					}
				});

				let model = monaco.editor.getModels()[0];
				monaco.editor.setModelMarkers(model, "owner", results);
			}
		});
		console.log("Should compile here!!");
		current_timeout = null;
	}, config.COMPILE_TYPING_TIMEOUT);
});

const theme_selection = document.getElementById("sl_theme") as HTMLSelectElement;
theme_selection.addEventListener('change', function(evt) {
	// @ts-ignore
	monaco.editor.setTheme(evt.target.value);
});

function try_compile(code: string, ready?: (http_success: boolean, resp: BlocklyPropResponse) => void) {
	ta_compile_out.innerText = "Compiling...";
	ready = ready || function() {};

	current_compile = compile(code);

	current_compile
		.then(resp => {
			if (resp.success) {
				ta_compile_out.innerText = `Compile: ${resp['compiler-output']}`;
			} else {
				ta_compile_out.innerText = `Failed to compile: ${resp['compiler-error']}`;
			}
			ready(true, resp);
		})
		.catch(reason => {
			ta_compile_out.innerText = `Failed to compile: ${reason}`;
			ready(false, reason);
		});
}

btn_clear.addEventListener('click', function(evt) {
	ta_compile_out.value = "";
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

const interval_id = setInterval(function() {
	try {
		let ctx = new LauncherConnection();
		ctx.connect()
			.catch(err => { console.log(err) })
			.then(ws => {
				connection = ctx;
				console.log("Requesting ports");
				ctx.requestPorts();
				clearInterval(interval_id);
			});
	} catch(err) {
		console.error(`Failed to establish connection with BlocklyPropLauncher (${err}). Retrying...`);
	}
}, 3000);