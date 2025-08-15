<script lang="ts">
	import '../../app.css';
	import LeftSidebar from '$lib/components/LeftSidebar.svelte';
	import MainContent from '$lib/components/MainContent.svelte';
	// import RightSidebar from '$lib/components/RightSidebar.svelte';
	import ExplorerModal from '$lib/components/modals/ExplorerModal.svelte';
	import FlaggedItemsModal from '$lib/components/modals/FlaggedItemsModal.svelte';
	import StatisticsModal from '$lib/components/modals/StatisticsModal.svelte';
	import DatabasesModal from '$lib/components/modals/DatabasesModal.svelte';
	import SpotlightSearchModal from '$lib/components/modals/SpotlightSearchModal.svelte';
	import ImageOcclusionModal from '$lib/components/modals/ImageOcclusionModal.svelte';
	import SettingsModal from '$lib/components/modals/SettingsModal.svelte';
	import ExportImportModal from '$lib/components/modals/ExportImportModal.svelte';
	import SummarizeModal from '$lib/components/modals/SummarizeModal.svelte';
	import TutorialModal from '$lib/components/modals/TutorialModal.svelte';
	import PolicyModal from '$lib/components/modals/PolicyModal.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { keyboardService } from '$lib/services/keyboard.service';
	import { database } from '$lib/stores/database.store';
	import { ui } from '$lib/stores/ui.store';
	import { page } from '$app/stores';

	let { children } = $props();
	
	// Initialize database store with user credentials
	$effect(() => {
		
		if ($page.data.user) {
			database.setCurrentUserId($page.data.user.name);
		}
		if ($page.data.password) {
			database.setCurrentUserPassword($page.data.password);
		}
	});
	
	// Load the database when user data is available
	$effect(() => {
		if ($page.data.user) {
			
			database.loadDatabase($page.data.user.name);
		}
	});

	// Initialize keyboard service
	onMount(() => {
		// Keyboard service is automatically initialized as a singleton
		ui.openPolicy();
	});

	// Cleanup keyboard service
	onDestroy(() => {
		keyboardService.destroy();
	});
</script>

<!-- Header -->
<header>
	<!-- Navigation will be handled by LeftSidebar -->
</header>

<!-- Main content area -->
<main id="main-content">
	<div id="wrapper">
		<LeftSidebar />
		<MainContent>
			{@render children()}
		</MainContent>
		<!-- <RightSidebar /> -->
	</div>
</main>

<!-- Footer -->
<footer>
	<!-- Footer content -->
</footer>

<ExplorerModal />
<FlaggedItemsModal />
<StatisticsModal />
<DatabasesModal />
<SpotlightSearchModal />
<ImageOcclusionModal />
<SettingsModal />
<ExportImportModal />
<SummarizeModal />
<PolicyModal />
<TutorialModal />

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
