<script lang="ts">
	import { contextmenu }  from '$lib/stores/contextmenu.store';
	import { ui }           from '$lib/stores/ui.store';
	import type { Record }  from '$lib/models';

	/* ---------- props ---------- */
	export let node: any;               // TreeNode | Record
	export let path: string[] = [];     // accumulated
	export let expandedFolders: Set<string>;
	export let activeItemId: string | null;

	const fullPath = path.join('/');

	const isFolder   = !node?._item || node._item.contentType === 'Folder';
	const record: Record | undefined = node?._item && isFolder ? node._item : node._item;

	/* ---------- toggle expand ---------- */
	function toggleFolder(e: MouseEvent) {
		e.stopPropagation();
		if (!isFolder) return;
		if (expandedFolders.has(fullPath)) ui.collapseFolder(fullPath);
		else                               ui.expandFolder(fullPath);
	}

	/* ---------- right‑click (optional, can rely on delegate) ---------- */
	function openContext(e: MouseEvent) {
		e.preventDefault();
		contextmenu.showContextMenu(e.clientX, e.clientY, fullPath, 'sidebar-item');
	}
</script>

<div class="pl-2">
	<!-- clickable line -->
	<p
		data-fullpath={fullPath}
		class="flex items-center gap-1 cursor-pointer rounded px-1 py-[2px] text-sm hover:bg-black/5 {activeItemId === fullPath ? 'bg-black/10' : ''}"
		on:click={toggleFolder}
		on:contextmenu={openContext}
	>
		<!-- icon -->
		{#if isFolder}
			<img src={`/img/${expandedFolders.has(fullPath) ? 'folderopen' : 'folderclose'}.svg`} class="h-4 w-4" />
		{:else if record?.contentType === 'Cloze'}
			<img src="/img/cloze.svg"      class="h-4 w-4" />
		{:else if record?.contentType === 'Extract'}
			<img src="/img/extract.svg"    class="h-4 w-4" />
		{:else if record?.contentType === 'Occlusion'}
			<img src="/img/occlusion2.svg" class="h-4 w-4" />
		{:else}
			<img src="/img/file.svg"       class="h-4 w-4" />
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
	/* no extra CSS – everything via Tailwind classes */
</style>
