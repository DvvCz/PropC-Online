import { sl_ports, ta_compile_out, write, writeLine } from "./page";

enum WSAction {
	Hello = "hello-client",
	Port = "port-list",
	Terminal = "serial-terminal",
	UiCommand = "ui-command",
	Alert = "alert",
	OpenTerminal = "open-terminal",
	CloseTerminal = "close-terminal",
	OpenGraph = "open-graph",
	CloseGraph = "close-graph",
	ClearCompile = "clear-compile",
	MessageCompile = "message-compile",
	CloseCompile = "close-compile",
	ConsoleLog = "console-log",
	CloseWebsocket = "websocket-close"
}

interface LauncherRecv {
	type: string, // see enums above

	version: string, // semver (e.g. 0.1.0)
	ports: string[], // list of ports

	msg: string,
	action: string,
}

export type DownloadType = "RAM"|"EEPROM"

interface LauncherSend {
	type: string,
	baudrate: number,

	// RAM = Temporary
	// EEPROM = Persistent
	action: DownloadType,

	portPath: string,


	// Base64 encoded payload (.elf, .bin, .eeprom etc)
	payload: string,

	debug: "none"|"term"|"graph",

	msg: string,
}

export class LauncherConnection {
	active?: WebSocket;
	ports: string[] = []; // Ports like ["COM4", "COM1"]
	requesting_ports: boolean = false;

	constructor() {}

	async connect(): Promise<WebSocket> {
		return new Promise((resolve, reject) => {
			const connection = new WebSocket("ws://localhost:6009");
			const self = this; // Bad, horrible

			connection.onopen = function(evt) {
				self.active = connection;
				// @ts-ignore
				console.log(`Connection is: ${evt.type}, URL: ${evt.target.url}.`);

				// @ts-ignore
				const payload: LauncherSend = {
					type: "hello-browser",
					// baudrate: 115200 ?
				};

				connection.send( JSON.stringify(payload) );

				resolve(connection);
			};

			connection.onerror = function(error) {
				console.error(`WebSocket error: ${error}`);
				self.close();
			};

			connection.onmessage = function(evt) {
				const msg: LauncherRecv = JSON.parse(evt.data);
				self.onMsg(msg);
			};

			connection.onclose = function(evt) {
				console.log(`Socket closed with code: ${evt.code}`);
			};
		});
	}

	close() {
		console.log("Closed websocket connection");
		if (this.active) this.active.close();
	}

	onMsg(msg: LauncherRecv) {
		switch (msg.type) {
			case WSAction.Hello:
				console.log(`BlocklyPropLauncher v${msg.version} detected!`);
				break;
			case WSAction.Port:
				if (this.requesting_ports) {
					sl_ports.options.length = 0;
					this.ports = msg.ports.filter( x => x.trim().length > 0 );
					for (let k in this.ports) {
						const port = this.ports[k];
						sl_ports.options[sl_ports.length] = new Option(port, port);
					}
					console.log(`Received Ports ${ msg.ports.length }!`);
					this.requesting_ports = false;
				}
			break;
			case WSAction.Terminal:
				let messageText;
				try {
					messageText = atob(msg.msg);
				} catch (error) {
					// only show the error if it's something other than base-64 encoding
					if (error.toString().indexOf('\'atob\'') < 0) {
						console.error(error);
					}
					messageText = msg.msg;
				}
				write( messageText.replace('\r', '\n') );
				break;
			case WSAction.UiCommand:
				switch (msg.action) {
					case "message-compile":
						write( msg.msg.replace('\r', '\n') );
						break
					case "open-terminal":
						console.log("Opening Terminal!");
						break
					case "close-compile":
						console.log("Closing Compile!");
						break
					default:
						console.log(`Unknown UiCommand: ${msg.action}`);
						break
				}
				break;
			default:
				console.log(`Unknown message type: ${ JSON.stringify(msg) }`);
		}
	}

	requestPorts() {
		// @ts-ignore
		const payload: LauncherSend = {
			type: 'port-list-request',
			msg: 'port-list-request',
		};

		if (this.active) {
			this.requesting_ports = true;
			this.active.send(  JSON.stringify(payload) );
		}
	}

	downloadCode(binary: string, extension: string, ty: DownloadType) {
		const payload = {
			type: 'load-prop',
			action: ty,
			portPath: sl_ports.options[sl_ports.selectedIndex].value,
			debug: 'term',
			extension: extension,
			payload: binary,
		};

		console.log(`Sending to port ${ payload.portPath }`);

		if (this.active) {
			this.active.send( JSON.stringify(payload) );
		}
	}
}