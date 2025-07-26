<script lang="ts">
	import "../app.css";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	// import ContextMenu from "$lib/components/ContextMenu.svelte";
	let { children } = $props();
</script>

<Toaster/>
<!-- <ContextMenu/> -->

{@render children()}
