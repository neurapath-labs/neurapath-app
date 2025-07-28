<script lang="ts">
	import "../app.css";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import SeoHead from "$lib/components/SeoHead.svelte";
	import ContextMenu from "$lib/components/ContextMenu.svelte";
	let { children } = $props();
</script>

<SeoHead />
<Toaster/>
<ContextMenu/>

{@render children()}
