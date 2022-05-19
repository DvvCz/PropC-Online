import * as monaco from 'monaco-editor';
import { IDEPlugin } from '../ide';

import { btn_import, btn_import_cancel, btn_import_open, div_popup, in_github_repo } from "../../site/page";
import { Console } from '../console';
import { TabHandler } from '../tabhandler';
import { ide } from '../..';

const RequestForm: RequestInit = { method: "GET" };

const FileRegex = /file\d+\.c/;
const BranchRegex = /blob\/([^\/]+)/;

async function scrape(repostr: string) {
	const full_link = `https://github.com/${repostr}`;

	// Assert link exists
	const text = await (await fetch(full_link)).text();

	const parser = new DOMParser();
	const doc = parser.parseFromString(text, "text/html");

	const files = doc.querySelectorAll(".flex-auto.min-width-0.col-md-2.mr-3")

	ide.can_autosave = false;

	files.forEach( async (elem, _) => {
		const link: HTMLAnchorElement = elem.children[0].children[0] as HTMLAnchorElement;
		const path = link.title;

		if (path == "main.c" || path.match(FileRegex)) {
			// I hate js sometimes
			const branch = BranchRegex.exec(link.href)?.[1] || "master";
			const raw_file_url = `https://raw.githubusercontent.com/${repostr}/${branch}/${path}`;
			try {
				const content = await (await fetch(raw_file_url)).text();
				ide.tab_handler.setSource(path, content)
				ide.tab_handler.addTab(path);
			} catch(err) {
				Console.error(`Failed to get file '${path}': ${err}`)
			}
		}
	});
}

async function api(repostr: string) {
	const repo_link = `https://api.github.com/repos/${repostr}`;
	const repo_data: { default_branch: string } = await (await fetch(repo_link)).json();
	const branch = repo_data.default_branch;

	const file_link = `https://api.github.com/repos/${repostr}/git/trees/${branch}`;
	const file_data: { tree: { path: string }[] } = await (await fetch(file_link)).json();

	const files = file_data.tree.map( x => x.path );

	for (const path of files) {
		if (path == "main.c" || path.match(FileRegex)) {
			const raw_file_url = `https://raw.githubusercontent.com/${repostr}/${branch}/${path}`;
			try {
				const content = await (await fetch(raw_file_url)).text();
				ide.tab_handler.setSource(path, content)
				ide.tab_handler.addTab(path);
			} catch(err) {
				Console.error(`Failed to get file '${path}': ${err}`)
			}
		}
	}
}

function onImportClicked() {
	const repo = in_github_repo.value;
	if (!repo || repo.trim() == "") {
		alert("Please enter a valid GitHub repo");
		return;
	}

	ide.can_autosave = false;

	try {
		// Needs to have CORS enabled. May not work.
		// scrape(repo);

		// This unfortunately will have a limit with github api calls.
		api(repo);

		ide.tab_handler.saveSources();
	} catch(err) {
		Console.error(`Failed to import from github: ${err}`);
	} finally {
		div_popup.style.visibility = "hidden";

		ide.can_autosave = true;
	}
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