import { getSetting, USER_SETTINGS } from "./config";

// Interacting with the page itself.
export const btn_send = document.getElementById("btn_send") as HTMLButtonElement;
export const btn_clear = document.getElementById("btn_clear") as HTMLButtonElement;
export const btn_download_bin = document.getElementById("btn_download_bin") as HTMLButtonElement;
export const ta_compile_out = document.getElementById("compile-out") as HTMLTextAreaElement;
export const sl_ports = document.getElementById("sl_ports") as HTMLSelectElement;
export const sl_type = document.getElementById("sl_type") as HTMLSelectElement;
export const in_baudrate = document.getElementById("in_baudrate") as HTMLSelectElement;
export const in_intellisense = document.getElementById("in_intellisense") as HTMLInputElement;

export function clear() {
	ta_compile_out.scrollTop = 0;
	ta_compile_out.value = "";
}

export function write(msg: string) {
	ta_compile_out.scrollTop = ta_compile_out.scrollHeight;
	ta_compile_out.value += msg;
}

export function writeLine(msg: string) {
	ta_compile_out.scrollTop = ta_compile_out.scrollHeight;
	ta_compile_out.value += (msg + "\r\n");
}

in_intellisense.checked = getSetting("intellisense");
in_baudrate.value = getSetting("baudrate");