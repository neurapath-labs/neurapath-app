<script lang="ts">
	import "../app.css";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import SeoHead from "$lib/components/SeoHead.svelte";
	import ContextMenu from "$lib/components/ContextMenu.svelte";
	import { browser } from '$app/environment';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import posthog from 'posthog-js';
	let { children } = $props();

	if (browser) {
		beforeNavigate(() => posthog.capture('$pageleave'));
		afterNavigate(() => posthog.capture('$pageview'));
	}
</script>

<SeoHead />
<Toaster/>
<ContextMenu/>

{@render children()}