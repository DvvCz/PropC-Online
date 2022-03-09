export const PROPC_COMPILER_ENDPOINT = "https://solo.parallax.com/single/prop-c/bin";

const SIMPLE_LIBS_PREFIX = "https://raw.githubusercontent.com/parallaxinc/Simple-Libraries/master/Learn/Simple%20Libraries/"
// Commit 1cc167c103756e5772b533c833a0f34e6050f459
export const PROPC_SIMPLETOOLS_ENDPOINT = SIMPLE_LIBS_PREFIX + "Utility/libsimpletools/simpletools.h";
export const PROPC_SIMPLETEXT_ENDPOINT = SIMPLE_LIBS_PREFIX + "TextDevices/libsimpletext/simpletext.h";
export const PROPC_FDSERIAL_ENDPOINT = SIMPLE_LIBS_PREFIX + "TextDevices/libfdserial/fdserial.h";

// Included in simpletools.h for you
export const PROPC_SIMPLEI2C_ENDPOINT = SIMPLE_LIBS_PREFIX + "Protocol/libsimplei2c/simplei2c.h"

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

const DEFAULT_SETTINGS = {
	theme: "vs-dark",

	code: DEFAULT_CODE,
	sources: { ["main.c"]: DEFAULT_CODE },

	intellisense: true,
	baudrate: 19200,

	selectedIndex: 0, // EEPROM (Saved) By default
};

export let USER_SETTINGS = JSON.parse(localStorage.getItem("propc_settings"));

if (!USER_SETTINGS) {
	USER_SETTINGS = DEFAULT_SETTINGS;
} else {
	// If there are any missing settings, get them from default
	for (let key in DEFAULT_SETTINGS) {
		if (!USER_SETTINGS[key]) {
			// @ts-ignore
			USER_SETTINGS[key] = DEFAULT_SETTINGS[key];
		}
	}
}

let settings_changed = false;
export function changeSetting(name: string, value: any) {
	USER_SETTINGS[name] = value;
	settings_changed = true;
}

export function getSetting(name: string) {
	return USER_SETTINGS[name];
}

setInterval(function() {
	if (settings_changed) {
		console.log(`Saving settings to localStorage.`);
		localStorage.setItem("propc_settings", JSON.stringify(USER_SETTINGS));
		settings_changed = false;
	}
}, 1000)