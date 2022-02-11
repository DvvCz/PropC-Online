// Inspecting error output from compiler
const REG = /\w+\.c:(\d+):(\d+): (error|warning): (.+)/;

interface CompileError {
	type: "error"|"warning";

	line: number,
	char: number,
	msg: string
}

export function getCompileResults(raw_msg: string): CompileError[] {
	let errors = [];
	let lines = raw_msg.split('\n');
	for (let line of lines) {
		let data = line.match(REG);
		if (data) {
			errors.push({
				line: +data[1],
				char: +data[2],
				type: data[3],
				msg: data[4]
			});
		}
	}
	return errors;
}