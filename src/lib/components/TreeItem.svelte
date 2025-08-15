<script lang="ts">
	// Define TreeNode type
	type TreeNode = { [k: string]: any; _item?: any };

	/* ─────── stores & types ─────── */
	import { contextmenu } from '$lib/stores/contextmenu.store';
	import { ui }          from '$lib/stores/ui.store';
	import { database }    from '$lib/stores/database.store';
	import type { Record } from '$lib/models';

	/* ─────── icons ─────── */
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ListIcon from '@lucide/svelte/icons/list';
	import ImageIcon from '@lucide/svelte/icons/image';
	import FileIcon from '@lucide/svelte/icons/file';
	import FlagIcon from '@lucide/svelte/icons/flag';

	/* ─────── self import for recursion ─────── */
	import TreeItem from './TreeItem.svelte';

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

	/* ─────── local state ─────── */
	let isDragOver = $state(false);

	/* ─────── derived helpers ─────── */
	let fullPath  = $derived(() => path.join('/'));

	let isFolder  = $derived(() => {
		const n = node;
		return !n._item || n._item?.contentType === 'Folder';
	});

	let isExtract  = $derived(() => {
		const n = node;
		return n._item && n._item?.contentType === 'Extract';
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

	function selectItem(e: MouseEvent) {
		e.stopPropagation();
		if (isFolder()) return;
		ui.setActiveItemId(fullPath());
	}

	function openContext(e: MouseEvent) {
		e.preventDefault();
		contextmenu.showContextMenu(e.clientX, e.clientY, fullPath(), 'sidebar-item');
	}

	/* ─────── drag and drop handlers ─────── */
	function handleDragStart(e: DragEvent) {
		if (!e.dataTransfer) return;
		
		// Allow dragging of both items and folders
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', fullPath());
	}

	function handleDragOver(e: DragEvent) {
		if (!isFolder()) return;
		
		e.preventDefault();
		e.stopPropagation(); // Prevent event from bubbling to sidebar
		e.dataTransfer!.dropEffect = 'move';
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	async function handleDrop(e: DragEvent) {
		if (!isFolder()) return;
		
		e.preventDefault();
		e.stopPropagation(); // Prevent event from bubbling to sidebar
		isDragOver = false;
		
		if (!e.dataTransfer) return;
		
		const itemId = e.dataTransfer.getData('text/plain');
		if (!itemId) return;
		
		// Don't allow dropping an item into itself or its children
		if (fullPath() === itemId || fullPath().startsWith(`${itemId}/`)) return;
		
		// Move the item to this folder
		const newParentPath = fullPath();
		await database.moveItem(itemId, newParentPath);
	}
</script>

<div class="pl-2">
	<!-- clickable line -->
	<button
		type="button"
		data-fullpath={fullPath()}
		class="flex cursor-pointer items-center gap-1 rounded px-1 py-[2px] text-sm {activeItemId === fullPath() ? 'bg-[rgba(var(--background-color_button),0.18)] hover:bg-[rgba(var(--background-color_button),0.24)]' : 'hover:bg-[rgba(var(--background-color_button),0.18)]'} {isDragOver ? 'bg-[rgba(var(--background-color_button),0.18)]' : ''} w-full text-left"
		onclick={isFolder() ? toggleFolder : selectItem}
		oncontextmenu={openContext}
		draggable={true}
		ondragstart={handleDragStart}
		ondragover={isFolder() ? handleDragOver : undefined}
		ondragleave={isFolder() ? handleDragLeave : undefined}
		ondrop={isFolder() ? handleDrop : undefined}
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
		{#if record() && record()!.isFlagged}
			<FlagIcon class="h-3.5 w-3.5 text-[rgb(var(--background-color_button))]" aria-label="Flagged" />
		{/if}
	</button>

	<!-- children -->
	{#if isFolder() && expandedFolders.has(fullPath())}
		{#each Object.entries(node).filter(([k]) => k !== '_item') as [childKey, childNode]}
			<TreeItem
			node={childNode as TreeNode}
			path={[...path, childKey]}
			{expandedFolders}
			{activeItemId}
			/>
		{/each}
	{:else if isExtract() && expandedFolders.has(fullPath())}
		{#each Object.entries(node).filter(([k]) => k !== '_item') as [childKey, childNode]}
			{#if (childNode as TreeNode)._item && (childNode as TreeNode)._item!.contentType === 'Cloze'}
				<TreeItem
				node={childNode as TreeNode}
				path={[...path, childKey]}
				{expandedFolders}
				{activeItemId}
				/>
			{/if}
		{/each}
	{/if}
</div>

<style>
	/* All styling via Tailwind utility classes above */
</style>
