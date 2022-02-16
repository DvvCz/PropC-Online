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

export const USER_SETTINGS = JSON.parse(localStorage.getItem("propc_settings")) || {
	theme: "vs-dark",
	code: DEFAULT_CODE,
	intellisense: true,
	baudrate: 19200,

	selectedIndex: 0, // EEPROM (Saved) By default
};

let settings_changed = false;
export function changeSetting(name: string, value: any) {
	if (USER_SETTINGS[name] !== value) {
		USER_SETTINGS[name] = value;
		settings_changed = true;
	}
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