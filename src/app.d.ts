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
	
	// Global declaration for localforage
	const localforage: {
		getItem<T>(key: string): Promise<T | null>;
		setItem<T>(key: string, value: T): Promise<T>;
		removeItem(key: string): Promise<void>;
		clear(): Promise<void>;
		length(): Promise<number>;
		key(keyIndex: number): Promise<string | null>;
		keys(): Promise<string[]>;
	};
}

export {};
