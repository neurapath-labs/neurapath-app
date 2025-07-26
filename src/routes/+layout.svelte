<script lang="ts">
	import "../app.css";
	// import ContextMenu from '$lib/components/ContextMenu.svelte';
	let { children } = $props();
</script>
{@render children()}
