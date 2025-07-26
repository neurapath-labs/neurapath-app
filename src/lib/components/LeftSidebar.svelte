<script lang="ts">
	/* ---------- stores ---------- */
	import { auth } from '$lib/stores/auth.store';
	import { database } from '$lib/stores/database.store';
	import { learning } from '$lib/stores/learning.store';
	import { ui } from '$lib/stores/ui.store';
	import { modal } from '$lib/stores/modal.store';
	import { theme } from '$lib/stores/theme.store';
	import type { Record } from '$lib/models';

	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	/* ---------- local state ---------- */
	let learningMode = false;
	let expandedFolders: Set<string> = new Set();
	let activeItemId: string | null = null;
	let currentTheme = 'day';

	/* ---------- lightweight subscriptions ---------- */
	const unsubLearning = learning.subscribe(
		($l) => (learningMode = $l.isInLearningMode)
	);
	const unsubUI = ui.subscribe(($u) => {
		expandedFolders = $u.expandedFolders;
		activeItemId = $u.activeItemId;
	});
	const unsubTheme = theme.subscribe(($t) => (currentTheme = $t.currentTheme));

	onDestroy(() => {
		unsubLearning();
		unsubUI();
		unsubTheme();
	});

	/* ---------- derived value ---------- */
	$: dueCount =
		$database.items.filter(
			(i) =>
				['Cloze', 'Extract', 'Occlusion'].includes(i.contentType) &&
				i.dueDate &&
				new Date(i.dueDate) <= new Date()
		).length;

	/* ---------- helpers ---------- */
	interface TreeNode {
		[k: string]: TreeNode | Record | undefined;
		_item?: Record;
	}

	const renderFolders = (items: Record[]): TreeNode => {
		const tree: TreeNode = {};
		items.forEach((item) => {
			const parts = item.id.split('/');
			let cursor: TreeNode = tree;
			parts.forEach((part, idx) => {
				cursor[part] ||= {};
				if (idx === parts.length - 1) (cursor[part] as TreeNode)._item = item;
				cursor = cursor[part] as TreeNode;
			});
		});
		return tree;
	};

	const renderTree = (tree: TreeNode, path: string[] = []): string =>
		Object.keys(tree)
			.filter((k) => k !== '_item')
			.map((k) => {
				const nowPath = [...path, k];
				const fullPath = nowPath.join('/');
				const node = tree[k] as TreeNode;
				const item = node._item;
				const expanded = expandedFolders.has(fullPath);

				return `
          <div class="menuSubItem">
            <p data-id="${fullPath}"
               data-fullpath="${fullPath}"
               class="${item ? item.contentType.toLowerCase() : 'folder'} ${
					activeItemId === fullPath ? 'active' : ''
				}">
              ${
					item && item.contentType === 'Folder'
						? `<img class="threeIcon" style="width: 18px; flex-shrink: 0;" src="/img/${
								expanded ? 'folderopen' : 'folderclose'
						  }.svg">`
						: item && item.contentType === 'Cloze'
						? '<img class="threeIcon" style="width: 18px;" src="/img/cloze.svg">'
						: item && item.contentType === 'Extract'
						? '<img class="threeIcon" style="width: 18px;" src="/img/extract.svg">'
						: item && item.contentType === 'Occlusion'
						? '<img class="threeIcon" src="/img/occlusion2.svg">'
						: '<img class="threeIcon" src="/img/folderclose.svg">'
				}
              ${k} ${item && item.isFlagged ? '🚩' : ''}
            </p>
            ${
						Object.keys(node).filter((c) => c !== '_item').length && expanded
							? `<div class="menuSubItemChildren">${renderTree(
									node,
									nowPath
							  )}</div>`
							: ''
					}
          </div>`;
			})
			.join('');

	/* ---------- command handlers ---------- */
	const toggleLearningMode = () => learning.toggleLearningMode();
	const handleLogout = async () => {
		await auth.logout();      
		window.location.href = '/login';
	};
	const openPdfImport = () => ui.openPdfImport();
	const renderExplorer = () => ui.openExplorer();
	const renderFlagged = () => ui.openFlagged();
	const renderStatistics = () => ui.openStatistics();
	const renderDatabases = () => ui.openDatabases();
	const toggleTheme = () =>
		theme.setTheme(currentTheme === 'day' ? 'night' : 'day');
</script>

<!-- ---------- markup (tailwind classes) ---------- -->
<aside
	class="grid-area[sidebar] flex h-screen w-[clamp(230px,26vw,280px)] min-w-[220px] flex-col gap-4 overflow-y-auto border-r border-black/5 bg-[rgb(var(--background-color_sidebar))] p-4 text-[rgb(var(--font-color))] select-none"
>
	<!-- header -->
	<header class="flex gap-3">
		<img src="/img/logo.svg" alt="neurapath logo" class="h-12 w-12" />
		<div class="space-y-1">
			<h1 class="m-0 text-xl leading-tight">Neuraa</h1>
			<p class="text-xs"><span>Last saved:</span> <span id="sidebar-last-saved">‑</span></p>
			<p class="text-xs">
				<span>Due today:</span>
				<span id="sidebar-due-items">{dueCount}</span>
			</p>
		</div>
	</header>

<Button
	id="learning-button"
	variant="outline"
	class={`rounded-md px-4 py-2 font-medium transition-colors
		${learningMode
			? 'bg-red-500/90 text-white hover:bg-red-600'
			: 'bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color))] hover:bg-[rgba(var(--background-color_button-hover))]'
		}`}
	on:click={toggleLearningMode}
>
	{learningMode ? 'Stop learning!' : 'Engage!'}
</Button>

	<!-- quick‑actions -->
	<nav id="quick-actions" class="flex flex-col gap-1 text-sm">
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={() => modal.openSettingsModal()}>
			<img src="/img/user.svg" alt="" class="h-4 w-4" /><span>Settings</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={toggleTheme}>
			<img src="/img/night-mode.svg" alt="" class="h-4 w-4" /><span id="darkmode-text">{currentTheme === 'day' ? 'Dark mode' : 'Light mode'}</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={renderDatabases}>
			<img src="/img/database.svg" alt="" class="h-4 w-4" /><span>Shared databases</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={openPdfImport}>
			<img src="/img/extract.svg" alt="" class="h-4 w-4" /><span>Import PDF</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={renderExplorer}>
			<img src="/img/find.svg" alt="" class="h-4 w-4" /><span>Item explorer</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={renderFlagged}>
			<img src="/img/unflag.svg" alt="" class="h-4 w-4" /><span>Flagged items</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={renderStatistics}>
			<img src="/img/statistics.svg" alt="" class="h-4 w-4" /><span>Statistics</span>
		</div>
		<div class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10" on:click={handleLogout}>
			<img src="/img/lock.svg" alt="" class="h-4 w-4" /><span>Logout</span>
		</div>
	</nav>

	<!-- content structure -->
	<section id="content-structure" class="mt-2 pr-2">
		{#if $database.items.length}
			{@html renderTree(renderFolders($database.items))}
		{:else}
			<p class="text-sm opacity-60">Quick start</p>
		{/if}
	</section>
</aside>