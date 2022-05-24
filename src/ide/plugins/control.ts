// Bottom row, under the editor
import * as monaco from 'monaco-editor';
import { IDEPlugin } from '../ide';

import * as FileSaver from "file-saver";
import { connection, DownloadType } from "../../link/launcher";
import { btn_clear, btn_download_bin, btn_send, sl_type } from "../../site/page";
import { tryCompile } from "../source";
import { GithubPlugin } from "./github";
import { Console } from '../console';

export class ControlPlugin implements IDEPlugin {
	static load(editor: monaco.editor.IStandaloneCodeEditor) {
		btn_clear.addEventListener("click", Console.clear);

		// 'Send to Robot' button
		btn_send.addEventListener("click", (evt) => {
			tryCompile((http_success, resp) => {
				if (http_success && resp.success) {
					if (connection) {
						const selected = sl_type.options[sl_type.selectedIndex];
						const dl_type = (selected ? selected.value : "EEPROM") as DownloadType;

						connection.downloadCode(resp.binary, resp.extension, dl_type);
					} else {
						Console.writeln("🔽 Download: Failed, no connection established with BlocklyPropLauncher");
					}
				}
			});
		});

		// 'Download Binary' button
		btn_download_bin.addEventListener("click", (evt) => {
			tryCompile((http_success, resp) => {
				if (http_success && resp.success) {
					let blob = new Blob([resp.binary], {type: "application/octet-stream"});
					FileSaver.saveAs(blob, `propc${resp.extension}`);
				}
			});
		});

		GithubPlugin.load(editor);
	}
}