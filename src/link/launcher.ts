import { sl_ports, in_baudrate } from "../site/page";
import { LAUNCHER_CONNECT_COOLDOWN } from "../site/config";
import { Console, Terminal } from "../ide/console";
import { ide } from "..";
import { parseCommandLine } from "typescript";

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

// Websocket Error Codes
const ErrorMessages: Record<number, string> = {
	1000: "Normal closure",
	1001: "Going away",
	1002: "Protocol error",
	1003: "Unsupported Data",
	1004: "Reserved",
	1005: "No status received",
	1006: "Abnormal closure",
	1007: "Invalid data",
	1008: "Policy violation",
	1009: "Message too big",
	1010: "Mandatory extension",
	1011: "Internal server error"
}

interface LauncherRecv {
	type: string, // see enums above

	version: string, // semver (e.g. 0.1.0)
	ports: string[], // list of ports

	msg: string,
	action: string,
}

export type DownloadType = "RAM"|"EEPROM"

let interval_id: number;
export let connection: LauncherConnection;

export function startConnecting() {
	stopConnecting();
	interval_id = setInterval(() => {
		try {
			let ctx = new LauncherConnection();
			ctx.connect()
				.catch(err => {
					Console.error(`Error when connecting to BlocklyPropLauncher ${err}`);
				})
				.then(ws => {
					connection = ctx;
					console.log("Requesting ports");
					ctx.requestPorts();
					stopConnecting();
				});
		} catch(err) {
			Console.error(`Failed to establish connection with BlocklyPropLauncher (${err}). Retrying...`);
		}
	}, LAUNCHER_CONNECT_COOLDOWN);
}

export function stopConnecting() {
	clearInterval(interval_id);
}

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

			connection.onopen = (evt) => {
				this.active = connection;

				// @ts-ignore
				const payload: LauncherSend = {
					type: "hello-browser",
					baudrate: in_baudrate.value ? Number.parseInt(in_baudrate.value) : 19200
				};

				connection.send( JSON.stringify(payload) );

				resolve(connection);
			};

			connection.onerror = (error) => {
				console.error(`WebSocket error: ${error.toString()}`);

				this.close();
			};

			connection.onmessage = (evt) => {
				const msg: LauncherRecv = JSON.parse(evt.data);
				this.onMsg(msg);
			};

			connection.onclose = (evt: CloseEvent) => {
				if (evt.reason) {
					console.log(`Socket closed with reason: '${evt.reason}' [${evt.code}] Reconnecting in ${ LAUNCHER_CONNECT_COOLDOWN / 1000 } seconds..`);
				} else if (evt.code != 1006) {
					// Ignore Abnormal Closure since that's usually because the launcher is not open.
					const reason = ErrorMessages[evt.code] || "Unknown reason";
					const msg = `Socket closed: '${reason}' [${evt.code}] Reconnecting in ${ LAUNCHER_CONNECT_COOLDOWN / 1000 } seconds..`;

					Console.warn(msg);
				}
				startConnecting();
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
				Console.writeln(`BlocklyPropLauncher v${msg.version} detected!`);
				break;
			case WSAction.Port:
				if (this.requesting_ports) {
					sl_ports.options.length = 0;
					this.ports = msg.ports.filter( x => x.trim().length > 0 );
					for (const k in this.ports) {
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
					if ((<DOMException>error).toString().indexOf("'atob'") < 0) {
						console.error(error);
					}
					messageText = msg.msg;
				}
				Terminal.process(messageText);
				break;
			case WSAction.UiCommand:
				switch (msg.action) {
					case "message-compile":
						Console.write( msg.msg.replace('\r', '\n') );
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
			this.active.send( JSON.stringify(payload) );
		}
	}

	downloadCode(binary: string, extension: string, ty: DownloadType) {
		const payload = {
			type: "load-prop",
			action: ty,
			portPath: sl_ports.options[sl_ports.selectedIndex].value,
			debug: "term",
			extension: extension,
			payload: binary,
		};

		console.log(`Sending to port ${ payload.portPath }`);

		if (this.active) {
			const full_payload = JSON.stringify(payload);
			if (full_payload.length > 70000) {
				Console.warn(`Payload of ${ full_payload.length } bytes may be too large to send to BlocklyPropLauncher!`);
			}
			this.active.send(full_payload);
		} else {
			Console.warn("Socket inactive, couldn't send code to robot.")
		}
	}
}