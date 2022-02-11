// Interacting with the page itself.
export const btn_download = document.getElementById("btn_download") as HTMLButtonElement;
export const btn_clear = document.getElementById("btn_clear") as HTMLButtonElement;
export const ta_compile_out = document.getElementById("compile-out") as HTMLTextAreaElement;
export const sl_ports = document.getElementById("sl_ports") as HTMLSelectElement;
export const sl_type = document.getElementById("sl_type") as HTMLSelectElement;

export function write(msg: string) {
	ta_compile_out.scrollTop = ta_compile_out.scrollHeight;
	ta_compile_out.value += msg;
}

export function writeLine(msg: string) {
	ta_compile_out.scrollTop = ta_compile_out.scrollHeight;
	ta_compile_out.value += (msg + "\r\n");
}