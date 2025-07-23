<script lang="ts">
	import '../../app.css';
	import LeftSidebar from '$lib/components/LeftSidebar.svelte';
	import MainContent from '$lib/components/MainContent.svelte';
	import RightSidebar from '$lib/components/RightSidebar.svelte';
	import LoginModal from '$lib/components/modals/LoginModal.svelte';

	let { children } = $props();

	let showLoginModal = $state(true);
</script>

<div id="wrapper">
	<LeftSidebar />
	<MainContent>
		{@render children()}
	</MainContent>
	<RightSidebar />
</div>

{#if showLoginModal}
	<div class="visible" id="overlay"></div>
	<LoginModal />
{/if}
