<script lang="ts">
	/* ─────── stores & types ─────── */
	import { contextmenu } from '$lib/stores/contextmenu.store';
	import { ui }          from '$lib/stores/ui.store';
	import type { Record } from '$lib/models';

	/* ─────── icons ─────── */
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ListIcon from '@lucide/svelte/icons/list';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FileIcon from '@lucide/svelte/icons/file';

	/* ─────── self import for recursion ─────── */
	import TreeItem from './TreeItem.svelte';

	/* ─────── type definitions ─────── */
	interface TreeNode { 
		[k: string]: TreeNode | Record | undefined; 
		_item?: Record;
	}

	/* ─────── incoming props (runes) ─────── */
	const {
		node,
		path = [],
		expandedFolders,
		activeItemId
	} = $props<{
		node: TreeNode;
		path?: string[];
		expandedFolders: Set<string>;
		activeItemId: string | null;
	}>();

	/* ─────── derived helpers ─────── */
	let fullPath  = $derived(() => path.join('/'));

	let isFolder  = $derived(() => {
		const n = node;
		return !n._item || n._item?.contentType === 'Folder';
	});

	let record = $derived(() => {
		const n = node;
		return n._item;
	});

	/* ─────── actions ─────── */
	function toggleFolder(e: MouseEvent) {
		e.stopPropagation();
		if (!isFolder()) return;
		ui.toggleFolderExpanded(fullPath());
	}

	function openContext(e: MouseEvent) {
		e.preventDefault();
		contextmenu.showContextMenu(e.clientX, e.clientY, fullPath(), 'sidebar-item');
	}
</script>

<div class="pl-2">
	<!-- clickable line -->
	<button
		type="button"
		data-fullpath={fullPath()}
		class="flex cursor-pointer items-center gap-1 rounded px-1 py-[2px] text-sm hover:bg-black/5 {activeItemId === fullPath() ? 'bg-black/10' : ''} w-full text-left"
		onclick={toggleFolder}
		oncontextmenu={openContext}
	>
		<!-- icon -->
		{#if isFolder()}
			{#if expandedFolders.has(fullPath())}
				<FolderOpenIcon class="h-4 w-4" />
			{:else}
				<FolderIcon class="h-4 w-4" />
			{/if}
		{:else if record() && record()!.contentType === 'Cloze'}
			<ListIcon class="h-4 w-4" />
		{:else if record() && record()!.contentType === 'Extract'}
			<FileTextIcon class="h-4 w-4" />
		{:else if record() && record()!.contentType === 'Occlusion'}
			<ImageIcon class="h-4 w-4" />
		{:else}
			<FileIcon class="h-4 w-4" />
		{/if}

		<span class="truncate">{path.at(-1)}</span>
		{#if record() && record()!.isFlagged} <span>🚩</span> {/if}
	</button>

	<!-- children -->
	{#if isFolder() && expandedFolders.has(fullPath())}
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
