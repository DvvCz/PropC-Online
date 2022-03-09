// Inspecting error output from compiler
const REG = /\w+\.c:(\d+):(\d+): (error|warning): (.+)/;

interface CompileError {
	type: "error"|"warning";

	line: number,

	char: number,
	end_char: number,

	msg: string
}

const RGX_UNKNOWN_FUNC = /implicit declaration of function '(\w+)'/;
function tryOverrides(reason: string, obj: CompileError) {
	if (obj.type == "warning") {
		let res = reason.match(RGX_UNKNOWN_FUNC);
		if (res) {
			let len = res[1].length;
			obj.end_char = obj.char + len;
		}
	}
}

export function getCompileResults(raw_msg: string): CompileError[] {
	let errors = [];
	let lines = raw_msg.split('\n');
	for (let line of lines) {
		let data = line.match(REG);
		if (data) {
			let msg = data[4];
			let obj: CompileError = {
				line: +data[1],
				char: +data[2],
				end_char: +data[2] + msg.length,
				type: data[3] as "error"|"warning",
				msg: msg
			};

			tryOverrides(msg, obj);
			errors.push(obj);
		}
	}
	return errors;
}