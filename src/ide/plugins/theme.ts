import * as monaco from 'monaco-editor';
import { IDEPlugin } from '../ide';

import { changeSetting, getSetting } from '../../site/config';
import { sl_theme } from '../../site/page';

export class ThemePlugin implements IDEPlugin {
	static load(editor: monaco.editor.IStandaloneCodeEditor) {
		sl_theme.addEventListener("change", function(evt: Event) {
			//@ts-ignore
			let theme: string = evt.target.value;
			monaco.editor.setTheme(theme);

			changeSetting("theme", theme);
		});
	}
}