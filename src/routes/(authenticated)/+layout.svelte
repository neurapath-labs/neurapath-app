<script lang="ts">
	import '../../app.css';
	import LeftSidebar from '$lib/components/LeftSidebar.svelte';
	import MainContent from '$lib/components/MainContent.svelte';
	import RightSidebar from '$lib/components/RightSidebar.svelte';
	import ExplorerModal from '$lib/components/modals/ExplorerModal.svelte';
	import FlaggedItemsModal from '$lib/components/modals/FlaggedItemsModal.svelte';
	import StatisticsModal from '$lib/components/modals/StatisticsModal.svelte';
	import DatabasesModal from '$lib/components/modals/DatabasesModal.svelte';
	import SpotlightSearchModal from '$lib/components/modals/SpotlightSearchModal.svelte';
	import ImageOcclusionModal from '$lib/components/modals/ImageOcclusionModal.svelte';
	import SettingsModal from '$lib/components/modals/SettingsModal.svelte';
	import ExportImportModal from '$lib/components/modals/ExportImportModal.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { keyboardService } from '$lib/services/keyboard.service';

	let { children } = $props();

	// Initialize keyboard service
	onMount(() => {
		// Keyboard service is automatically initialized as a singleton
	});

	// Cleanup keyboard service
	onDestroy(() => {
		keyboardService.destroy();
	});
</script>

<div id="wrapper">
	<LeftSidebar />
	<MainContent>
		{@render children()}
	</MainContent>
	<RightSidebar />
</div>

<ExplorerModal />
<FlaggedItemsModal />
<StatisticsModal />
<DatabasesModal />
<SpotlightSearchModal />
<ImageOcclusionModal />
<SettingsModal />
<ExportImportModal />

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
