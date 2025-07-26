import adapter from '@sveltejs/adapter-cloudflare';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	compilerOptions: {
		runes: true
	},
	kit: {
		adapter: adapter({
			// See below for an explanation of these options
			config: undefined,
			platformProxy: {
				configPath: undefined,
				environment: undefined,
				persist: undefined
			},
			fallback: 'plaintext',
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		}),
	alias: {
      "@/*": "./src/lib/*",
    },
	}
};