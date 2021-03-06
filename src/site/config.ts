export const PROPC_COMPILER_ENDPOINT = "https://solo.parallax.com/single/prop-c/bin";

export const SIMPLELIBS_REPO = "https://raw.githubusercontent.com/parallaxinc/Simple-Libraries/master/Learn/Simple%20Libraries/"
// Commit 1cc167c103756e5772b533c833a0f34e6050f459
export const PROPC_SIMPLETOOLS_ENDPOINT = SIMPLELIBS_REPO + "Utility/libsimpletools/simpletools.h";
export const PROPC_SIMPLETEXT_ENDPOINT = SIMPLELIBS_REPO + "TextDevices/libsimpletext/simpletext.h";
export const PROPC_FDSERIAL_ENDPOINT = SIMPLELIBS_REPO + "TextDevices/libfdserial/fdserial.h";

// Included in simpletools.h for you
export const PROPC_SIMPLEI2C_ENDPOINT = SIMPLELIBS_REPO + "Protocol/libsimplei2c/simplei2c.h"

export const DEFAULT_CODE = `
// Simpletools is from parallax and can be found here:
// ${ PROPC_SIMPLETOOLS_ENDPOINT }
#include "simpletools.h"
#include "stdbool.h"
int main() {
	print("Hello");
	print(" world!");
	// -> "Hello world!"

	int reps = 0;
	while (true) {
		// Make sure to have \\r after your prints to add a line in between messages.
		print("This has repeated %d times.\\r", reps++);

		// Sleep for 400 milliseconds
		pause(400);
	}
}
`.substring(1); // Remove leading \n

// How many milliseconds to wait until the user stops typing to automatically compile.
// Should be pretty high to avoid a ton of requests to compile.
export const COMPILE_TYPING_TIMEOUT = 900;

// Milliseconds in between each attempt to connect to the BlocklyPropLauncher.
export const LAUNCHER_CONNECT_COOLDOWN = 3000;

const DEFAULT_SETTINGS: Record<string, any> = {
	theme: "vs-dark",

	code: DEFAULT_CODE,
	sources: { ["main.c"]: DEFAULT_CODE },

	intellisense: true,
	baudrate: 19200,

	selectedIndex: 0, // EEPROM (Saved) By default
};

export let USER_SETTINGS: Record<string, any> = DEFAULT_SETTINGS;

const propc_settings = localStorage.getItem("propc_settings");
if (propc_settings) {
	try {
		USER_SETTINGS = JSON.parse(propc_settings);

		// If there are any missing settings, get them from default
		for (const key in DEFAULT_SETTINGS) {
			if (!USER_SETTINGS[key]) {
				USER_SETTINGS[key] = DEFAULT_SETTINGS[key];
			}
		}
	} catch (e) {}
}

let autosave_interval: number|null = null;
export function changeSetting(name: string, value: any) {
	USER_SETTINGS[name] = value;

	if (!autosave_interval) {
		autosave_interval = setTimeout(saveSettings, 1000);
	}
}

export function getSetting(name: string) {
	return USER_SETTINGS[name];
}

function saveSettings() {
	console.log(`Saving settings to localStorage.`);

	// Just in case json stringify fails..
	const json = JSON.stringify(USER_SETTINGS);
	if (json) {
		localStorage.setItem("propc_settings", JSON.stringify(USER_SETTINGS));
	}

	autosave_interval = null;
}