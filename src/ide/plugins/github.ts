import * as monaco from 'monaco-editor';
import { IDEPlugin } from '../ide';

import { btn_import, btn_import_cancel, btn_import_open, div_popup, in_github_repo } from "../../site/page";
import { Console } from '../console';
import { addTab, saveSources, setSource } from '../tabhandler';
import { ide } from '../..';

const RequestForm: RequestInit = {
	"method": "GET",
	// 	"credentials": "omit"
};

const FileRegex = /file\d+\.c/;
const BranchRegex = /blob\/([^\/]+)/;

function onImportClicked() {
	const repo = in_github_repo.value;
	if (!repo || repo.trim() == "") {
		alert("Please enter a valid GitHub repo");
		return;
	}

	const full_link = `https://github.com/${repo}.git`;

	function handle_err(err: any) {
		alert(`Error: ${err}`);
	}

	// Assert link exists
	fetch(full_link, RequestForm)
	.then((res) => res.text())
	.then((text) => {
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(text, "text/html");

			const promises = [];

			const files = doc.querySelectorAll(".flex-auto.min-width-0.col-md-2.mr-3")
			let fulfilled = 0;
			let must_fulfill = files.length;

			ide.can_autosave = false;

			function checkFulfilled() {
				if (fulfilled == must_fulfill) {
					// All done!
					saveSources();
					ide.can_autosave = true;

					div_popup.style.visibility = "hidden";
					Console.writeln(`✔️ Successfully imported from ${repo}!`);
				}
			}

			files.forEach( (elem, key) => {
				const link: HTMLAnchorElement = elem.children[0].children[0] as HTMLAnchorElement;
				// Verify files are named properly (since our tab handler doesn't have renames yet...)
				if (link.title == "main.c" || link.title.match(FileRegex)) {
					// I hate js sometimes
					const branch = BranchRegex.exec(link.href)[1];
					const final_url = `https://raw.githubusercontent.com/${repo}/${branch}/${link.title}`;
					promises.push(
						fetch(final_url, RequestForm)
							.then( (res) => res.text() )
							.then( (content) => {
								setSource(link.title, content)

								fulfilled++;
								checkFulfilled();
								addTab(link.title);
							})
							.catch((err) => {
								checkFulfilled();

								must_fulfill--;
								Console.error(`Failed to get file '${link.title}': ${err}`)
							})
					);
				}
			});

			div_popup.style.visibility = "hidden";
		} catch(err) {
			Console.error(`Failed to import from github: ${err}`);
		}
	})
	.catch(handle_err);
}

export class GithubPlugin implements IDEPlugin {
	static load(editor: monaco.editor.IStandaloneCodeEditor) {
		btn_import_open.addEventListener("click", function(evt) {
			div_popup.style.visibility = "visible";
		});

		btn_import_cancel.addEventListener("click", function(evt) {
			div_popup.style.visibility = "hidden";
		});

		btn_import.addEventListener("click", onImportClicked);
	}
}