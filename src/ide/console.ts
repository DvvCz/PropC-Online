import { div_console } from "../site/page";

const COMMAND_REGEX = /<(\w+)>([^<]+)<\/\1>/g;

function escapeHTML(str: string) {
	return str
		.replaceAll(/&/g, "&amp;")
		.replaceAll(/</g, "&lt;")
		.replaceAll(/>/g, "&gt;")
		.replaceAll(/"/g, "&quot;")
		.replaceAll(/'/g, "&#039;");
}

export class Console {
	static clear() {
		div_console.scrollTop = 0;
		div_console.innerHTML = "";
	}

	static write(msg: string) {
		div_console.scrollTop = div_console.scrollHeight;
		div_console.innerHTML += escapeHTML(msg);
	}

	static writeln(msg: string) {
		this.write(msg + "\n");
	}

	static warn(msg: string) {
		this.writeln(`⚠️: ${msg}`);
		console.warn(msg);
	}

	static error(msg: string) {
		this.writeln(`❌: ${msg}`);
		console.error(msg);
	}

	static image(url: string) {
		const img = document.createElement("img");
		img.src = url;
		img.alt = url;

		img.width = 50;
		img.height = 50;

		div_console.appendChild(img);
	}

	/// Process incoming messages from the BlocklyPropLauncher
	static process(command: string) {
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
					Console.image(value);
					return "";
				case "clear":
					Console.clear();
					return "";
				default:
					Console.error(`Unknown terminal command: ${name}`)
					return substr;
			}
		});

		console.log(command);

		/// Then print out the rest of the message
		this.write( command.replace('\r', '\n') );
	}
}