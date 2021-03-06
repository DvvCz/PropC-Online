import * as config from './config';

// Connection with solo.parallax.com
const fetch_payload: RequestInit = {
	method: 'POST',
	// mode: 'cors',
	cache: 'no-cache',
	headers: {
		'Content-Type': 'application/json',
	},
	redirect: 'follow',
	referrerPolicy: 'no-referrer'
};

export interface BlocklyPropResponse {
	success: boolean;
	"compiler-output": string;
	"compiler-error": string;
	binary: string;
	extension: ".elf"|string;
}

export async function compile(code: string): Promise<BlocklyPropResponse> {
	fetch_payload.body = code;
	try {
		const resp: BlocklyPropResponse = await fetch(config.PROPC_COMPILER_ENDPOINT, fetch_payload).then(r => r.json());
		return resp;
	} catch(err) {
		// Invalid payload?
		return Promise.reject(`Failed to compile: ${err}`);
	}
}