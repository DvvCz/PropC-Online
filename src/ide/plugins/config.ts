import * as monaco from 'monaco-editor';
import { IDEPlugin } from '../ide';

import { changeSetting, getSetting } from "../../site/config";
import { in_intellisense, sl_type } from "../../site/page";
import { loadStandardLibraries } from "./completion";

export class ConfigPlugin implements IDEPlugin {
	static load(editor: monaco.editor.IStandaloneCodeEditor) {
		in_intellisense.addEventListener("click", (evt) => {
			if (in_intellisense.checked) {
				// Try and get functions from simpletools.h
				loadStandardLibraries();
			}
			changeSetting("intellisense", in_intellisense.checked);
		});

		sl_type.selectedIndex = getSetting("download_type") as number;
		sl_type.addEventListener("change", (evt) => {
			changeSetting("download_type", sl_type.selectedIndex);
		});
	}
}