<script lang="ts">
	import '../../app.css';
	import LeftSidebar from '$lib/components/LeftSidebar.svelte';
	import MainContent from '$lib/components/MainContent.svelte';
	import RightSidebar from '$lib/components/RightSidebar.svelte';

	let { children } = $props();
</script>

<div id="wrapper">
	<LeftSidebar />
	<MainContent>
		{@render children()}
	</MainContent>
	<RightSidebar />
</div>

<style>
	#wrapper {
		display: grid;
		grid-template-columns: min-content 1fr min-content;
		grid-template-rows: 1fr;
		grid-template-areas: "sidebar body similar";
		width: 100vw;
		height: 100vh;
	}
</style>
