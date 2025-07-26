<script lang="ts">
	/* ---------- stores ---------- */
	import { auth }       from '$lib/stores/auth.store';
	import { database }   from '$lib/stores/database.store';
	import { learning }   from '$lib/stores/learning.store';
	import { ui }         from '$lib/stores/ui.store';
	import { modal }      from '$lib/stores/modal.store';
	import { theme }      from '$lib/stores/theme.store';
	import { contextmenu } from '$lib/stores/contextmenu.store';
	import type { Record } from '$lib/models';

	import { onDestroy } from 'svelte';
	import { Button }    from '$lib/components/ui/button';
	import TreeItem      from '$lib/components/TreeItem.svelte';
	
	/* ---------- icons ---------- */
	import UserIcon      from '@lucide/svelte/icons/user';
	import MoonIcon      from '@lucide/svelte/icons/moon';
	import DatabaseIcon  from '@lucide/svelte/icons/database';
	import FileTextIcon  from '@lucide/svelte/icons/file-text';
	import SearchIcon    from '@lucide/svelte/icons/search';
	import FlagIcon      from '@lucide/svelte/icons/flag';
	import BarChartIcon  from '@lucide/svelte/icons/bar-chart';
	import LogOutIcon    from '@lucide/svelte/icons/log-out';

	/* ---------- local state ---------- */
	let learningMode = false;
	let expandedFolders: Set<string> = new Set();
	let activeItemId: string | null = null;
	let currentTheme = 'day';

	/* ---------- subscriptions ---------- */
	const unsubLearning = learning.subscribe(($l) => {
		learningMode = $l.isInLearningMode;
		console.log('[LeftSidebar] learning.isInLearningMode →', learningMode);
	});
	const unsubUI = ui.subscribe(($u) => {
		expandedFolders = $u.expandedFolders;
		activeItemId   = $u.activeItemId;
		// (spam‐free; remove if noisy)
	});
	const unsubTheme = theme.subscribe(($t) => (currentTheme = $t.currentTheme));

	onDestroy(() => { unsubLearning(); unsubUI(); unsubTheme(); });

	/* ---------- derived ---------- */
	$: dueCount =
		$database.items.filter(
			(i) =>
				['Cloze', 'Extract', 'Occlusion'].includes(i.contentType) &&
				i.dueDate &&
				new Date(i.dueDate) <= new Date()
		).length;

	/* ---------- folder util ---------- */
	interface TreeNode { [k: string]: TreeNode | Record | undefined; _item?: Record }
	const renderFolders = (items: Record[]): TreeNode => {
		const tree: TreeNode = {};
		for (const item of items) {
			const parts = item.id.split('/');
			let cur: TreeNode = tree;
			parts.forEach((part, i) => {
				cur[part] ||= {};
				if (i === parts.length - 1) (cur[part] as TreeNode)._item = item;
				cur = cur[part] as TreeNode;
			});
		}
		return tree;
	};

	/* ---------- header / quick‑action handlers ---------- */
	const toggleLearningMode = () => learning.toggleLearningMode();
	const handleLogout       = async () => { await auth.logout(); window.location.href = '/login'; };
	const openPdfImport      = () => ui.openPdfImport();
	const renderExplorer     = () => ui.openExplorer();
	const renderFlagged      = () => ui.openFlagged();
	const renderStatistics   = () => ui.openStatistics();
	const renderDatabases    = () => ui.openDatabases();
	const toggleTheme        = () => theme.setTheme(currentTheme === 'day' ? 'night' : 'day');

	/* ---------- universal sidebar context menu ---------- */
	function handleSidebarContextMenu(e: MouseEvent) {
		e.preventDefault();

		/* is the click on a record element? */
		const el       = (e.target as HTMLElement).closest('[data-fullpath]');
		const fullPath = el?.getAttribute('data-fullpath');

		/* log for debugging */
		console.log('[LeftSidebar] right‑click', {
			fullPath,
			x: e.clientX,
			y: e.clientY,
			type: fullPath ? 'sidebar-item' : 'sidebar-background'
		});

		contextmenu.showContextMenu(
			e.clientX,
			e.clientY,
			fullPath ?? null,
			fullPath ? 'sidebar-item' : 'sidebar-background'
		);
	}
</script>

<aside
	class="grid-area[sidebar] flex h-screen w-[clamp(230px,26vw,280px)] min-w-[220px] flex-col gap-4 overflow-y-auto border-r border-black/5 bg-[rgb(var(--background-color_sidebar))] p-4 text-[rgb(var(--font-color))] select-none"
	on:contextmenu|preventDefault={handleSidebarContextMenu}
>
	<!-- header -->
	<header class="flex gap-3">
		<img src="/img/logo.svg" alt="neurapath logo" class="h-12 w-12" />
		<div class="space-y-1">
			<h1 class="m-0 text-xl leading-tight">Neuraa</h1>
			<p class="text-xs"><span>Last saved:</span> <span id="sidebar-last-saved">‑</span></p>
			<p class="text-xs"><span>Due today:</span> <span id="sidebar-due-items">{dueCount}</span></p>
		</div>
	</header>

	<!-- learning button -->
	<Button
		id="learning-button"
		variant="outline"
		class={`rounded-md px-4 py-2 font-medium transition-colors ${
			learningMode
				? 'bg-red-500/90 text-white hover:bg-red-600'
				: ''
		}`}
		on:click={toggleLearningMode}
	>
		{learningMode ? 'Stop learning!' : 'Engage!'}
	</Button>

	<!-- quick‑actions -->
	<nav id="quick-actions" class="flex flex-col gap-1 text-sm">
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={() => modal.openSettingsModal()}>
			<UserIcon class="h-4 w-4" /><span>Settings</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={toggleTheme}>
			<MoonIcon class="h-4 w-4" /><span id="darkmode-text">{currentTheme === 'day' ? 'Dark mode' : 'Light mode'}</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={renderDatabases}>
			<DatabaseIcon class="h-4 w-4" /><span>Shared databases</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={openPdfImport}>
			<FileTextIcon class="h-4 w-4" /><span>Import PDF</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={renderExplorer}>
			<SearchIcon class="h-4 w-4" /><span>Item explorer</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={renderFlagged}>
			<FlagIcon class="h-4 w-4" /><span>Flagged items</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={renderStatistics}>
			<BarChartIcon class="h-4 w-4" /><span>Statistics</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={handleLogout}>
			<LogOutIcon class="h-4 w-4" /><span>Logout</span>
		</div>
	</nav>

	<!-- tree -->
	<section id="content-structure" class="mt-2 pr-2">
		{#if $database.items.length}
			{#each Object.entries(renderFolders($database.items)) as [key, node]}
				<TreeItem {node} path={[key]} {expandedFolders} {activeItemId} />
			{/each}
		{:else}
			<p class="text-sm opacity-60">Quick start</p>
		{/if}
	</section>
</aside>
