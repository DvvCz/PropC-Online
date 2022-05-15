import { ta_compile_out } from "../site/page";

export class Console {
	static clear() {
		ta_compile_out.scrollTop = 0;
		ta_compile_out.value = "";
	}

	static write(msg: string) {
		ta_compile_out.scrollTop = ta_compile_out.scrollHeight;
		ta_compile_out.value += msg;
	}

	static writeln(msg: string) {
		ta_compile_out.scrollTop = ta_compile_out.scrollHeight;
		ta_compile_out.value += (msg + "\r\n");
	}

	static warn(msg: string) {
		this.writeln(`⚠️: ${msg}`);
		console.warn(msg);
	}

	static error(msg: string) {
		this.writeln(`❌: ${msg}`);
		console.error(msg);
	}
}