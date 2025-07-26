<script lang="ts">
	/* ─────── stores & types ─────── */
	import { contextmenu } from '$lib/stores/contextmenu.store';
	import { ui }          from '$lib/stores/ui.store';
	import type { Record } from '$lib/models';

	/* ─────── incoming props (runes) ─────── */
	const {
		node,
		path = [],
		expandedFolders,
		activeItemId
	} = $props<{
		node: any;                  // TreeNode | Record
		path?: string[];
		expandedFolders: Set<string>;
		activeItemId: string | null;
	}>();

	/* ─────── derived helpers ─────── */
	let fullPath  = $derived(() => path.join('/'));

	let isFolder  = $derived(() => {
		const n = node;
		return !n?._item || n._item.contentType === 'Folder';
	});

	let record = $derived<Record | undefined>(() => {
		const n = node;
		return n?._item && isFolder ? n._item : n._item;
	});

	/* ─────── actions ─────── */
	function toggleFolder(e: MouseEvent) {
		e.stopPropagation();
		if (!isFolder) return;
		expandedFolders.has(fullPath)
			? ui.collapseFolder(fullPath)
			: ui.expandFolder(fullPath);
	}

	function openContext(e: MouseEvent) {
		e.preventDefault();
		contextmenu.showContextMenu(e.clientX, e.clientY, fullPath, 'sidebar-item');
	}
</script>

<div class="pl-2">
	<!-- clickable line -->
	<p
		data-fullpath={fullPath}
		class="flex cursor-pointer items-center gap-1 rounded px-1 py-[2px] text-sm hover:bg-black/5 {activeItemId === fullPath ? 'bg-black/10' : ''}"
		onclick={toggleFolder}
		oncontextmenu={openContext}
	>
		<!-- icon -->
		{#if isFolder}
			<img
				src={`/img/${expandedFolders.has(fullPath) ? 'folderopen' : 'folderclose'}.svg`}
				class="h-4 w-4"
			/>
		{:else if record?.contentType === 'Cloze'}
			<img src="/img/cloze.svg" alt="Cloze icon" class="h-4 w-4" />
		{:else if record?.contentType === 'Extract'}
			<img src="/img/extract.svg" alt="Extract icon" class="h-4 w-4" />
		{:else if record?.contentType === 'Occlusion'}
			<img src="/img/occlusion2.svg" alt="Occlusion icon" class="h-4 w-4" />
		{:else}
			<img src="/img/file.svg" alt="File icon" class="h-4 w-4" />
		{/if}

		<span class="truncate">{path.at(-1)}</span>
		{#if record?.isFlagged} <span>🚩</span> {/if}
	</p>

	<!-- children -->
	{#if isFolder && expandedFolders.has(fullPath)}
		{#each Object.entries(node).filter(([k]) => k !== '_item') as [childKey, childNode]}
			<TreeItem
			node={childNode}
			path={[...path, childKey]}
			{expandedFolders}
			{activeItemId}
			/>
		{/each}
	{/if}
</div>

<style>
	/* All styling via Tailwind utility classes above */
</style>
