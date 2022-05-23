import { div_console } from "../site/page";
import * as util from "../util";

const COMMAND_REGEX = /<(\w+)>([^<]+)<\/\1>/g;

function escapeHTML(str: string) {
	return str
		.replaceAll(/&/g, "&amp;")
		.replaceAll(/</g, "&lt;")
		.replaceAll(/>/g, "&gt;")
		.replaceAll(/"/g, "&quot;")
		.replaceAll(/'/g, "&#039;");
}

class Window {
	element: HTMLDivElement;

	constructor(div: HTMLDivElement) {
		this.element = div;
	}

	clear() {
		element.scrollTop = 0;
		element.innerHTML = "";
	}

	write(msg: string) {
		element.scrollTop = element.scrollHeight;
		element.innerHTML += escapeHTML(msg);
	}

	writeln(msg: string) {
		this.write(msg + "\n");
	}

	warn(msg: string) {
		this.writeln(`⚠️: ${msg}`);
		console.warn(msg);
	}

	error(msg: string) {
		this.writeln(`❌: ${msg}`);
		console.error(msg);
	}

	image(url: string) {
		const img = document.createElement("img");
		img.src = url;
		img.alt = url;

		img.width = 50;
		img.height = 50;

		element.appendChild(img);
	}

	/// Process incoming messages from the BlocklyPropLauncher
	process(command: string) {
		/// First look for commands formatted in html/xml format.
		/// E.g. <tts>message</tts>
		/// Then remove them / replace with whatever value they'd return.
		/// You'd use this for values you don't have in the robot or for things you can't do (well), like TTS.
		/// This pretty much extends functionality of propeller C just by using print().
		command = command.replaceAll(COMMAND_REGEX, function(substr, name, value) {
			switch (name) {
				case "tts":
					const msg = new SpeechSynthesisUtterance(value);
					window.speechSynthesis.speak(msg);
					return "";
				case "time": /// Return current time as a string
					return new Date().toLocaleTimeString();
				case "image": /// Embed an image
				case "img":
					this.image(value);
					return "";
				case "clear":
					this.clear();
					return "";
				default:
					this.error(`Unknown terminal command: ${name}`)
					return substr;
			}
		});

		console.log(command);

		/// Then print out the rest of the message
		this.write( command.replace('\r', '\n') );
	}
}

export const Terminal = new Window(div_console);
export const Console = new Window(div_problems);