export const PROPC_COMPILER_ENDPOINT = "https://solo.parallax.com/single/prop-c/bin";

export const DEFAULT_CODE = `
// Simpletools is from parallax and can be found here:
// https://github.com/parallaxinc/BlocklyPropClient/blob/master/propeller-c-lib/Utility/libsimpletools/simpletools.h
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