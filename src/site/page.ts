/*
	All HTML Elements the page uses
*/
import { getSetting } from "./config";

export const div_editor = document.getElementById("div_editor") as HTMLDivElement;

// Controls
export const btn_send = document.getElementById("btn_send") as HTMLButtonElement;
export const btn_clear = document.getElementById("btn_clear") as HTMLButtonElement;
export const btn_download_bin = document.getElementById("btn_download_bin") as HTMLButtonElement;

// Import github repos
export const div_popup = document.getElementById("div_popup") as HTMLDivElement;
export const btn_import = document.getElementById("btn_import") as HTMLButtonElement;
export const btn_import_cancel = document.getElementById("btn_import_cancel") as HTMLButtonElement;
export const btn_import_open = document.getElementById("btn_import_open") as HTMLButtonElement;
export const in_github_repo = document.getElementById("in_github_repo") as HTMLInputElement;

// Configs
export const sl_ports = document.getElementById("sl_ports") as HTMLSelectElement;
export const sl_type = document.getElementById("sl_type") as HTMLSelectElement;
export const sl_theme = document.getElementById("sl_theme") as HTMLSelectElement;
export const in_baudrate = document.getElementById("in_baudrate") as HTMLSelectElement;
export const in_intellisense = document.getElementById("in_intellisense") as HTMLInputElement;
export const ide_tabs = document.getElementById("ide-tabs") as HTMLDivElement;
// 			<textarea id="compile-out" cols="218" rows="10" readonly></textarea>

export const div_console = document.getElementById("div_console") as HTMLDivElement;
export const div_terminal = document.getElementById("div_terminal") as HTMLDivElement;

in_intellisense.checked = getSetting("intellisense");
sl_theme.value = getSetting("theme");
in_baudrate.value = getSetting("baudrate");

document.getElementById("title")!.innerHTML = `PropC Online 1.6.0b2`;