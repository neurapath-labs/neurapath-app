// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Locals {
			user: {
				name: string;
				role: string;
			} | null;
		}
		// interface Platform {}
	}
}

export {};
