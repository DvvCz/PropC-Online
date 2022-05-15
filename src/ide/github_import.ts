import { btn_import, btn_import_cancel, btn_import_open, div_popup, in_github_repo } from "../site/page";

export function addGHEventListeners() {
	btn_import_open.addEventListener("click", function(evt) {
		div_popup.style.visibility = "visible";
	});

	btn_import_cancel.addEventListener("click", function(evt) {
		div_popup.style.visibility = "hidden";
	});

	btn_import.addEventListener("click", onImportClicked);
}

export function onImportClicked() {
	const repo = in_github_repo.value;
	if (!repo || repo.trim() == "") {
		alert("Please enter a valid GitHub repo");
		return;
	}

	const full_link = `https://github.com/${repo}`;

	function handle_err(err: any) {
		alert(`Error: ${err}`);
	}

	console.log(full_link);
	// Assert link exists
	fetch(full_link, { mode: 'no-cors' })
		.then((res) => res.text())
		.then((text) => {
			console.log("Got body", text);

			const parser = new DOMParser();
			const doc = parser.parseFromString(text, "text/html");
			for (const elem in doc.querySelectorAll(".flex-auto.min-width-0.col-md-2.mr-3")) {
				console.log(elem);
			}
		})
		.catch(handle_err);
}