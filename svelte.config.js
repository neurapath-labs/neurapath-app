import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: true,
		experimental: {
			async: true
		},
	},
	kit: {
		experimental: {
			remoteFunctions: true,
		},
		adapter: adapter({
			// See below for an explanation of these options
			// config: undefined,
			// platformProxy: {
			//   configPath: undefined,
			//   environment: undefined,
			//   persist: undefined
			// },
			// fallback: 'plaintext',
			// routes: {
			//   include: ['/*'],
			//   exclude: ['<all>']
			// }
		}),
		alias: {
			"@/*": "./src/lib/*",
		},
		paths: {
			relative: false, // Required for PostHog session replay to work correctly
		}
	},
};