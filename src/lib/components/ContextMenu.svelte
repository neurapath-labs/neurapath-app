<script lang="ts">
	/* ------------------------------------------------------------------
	   STORES & HELPERS
	------------------------------------------------------------------ */
	import {
		ContextMenu,
		ContextMenuTrigger,
		ContextMenuContent,
		ContextMenuItem,
		ContextMenuSeparator
	} from '$lib/components/ui/context-menu';

	import { contextmenu }  from '$lib/stores/contextmenu.store';
	import { selection }    from '$lib/stores/selection.store';
	import { database }     from '$lib/stores/database.store';
	import { modal }        from '$lib/stores/modal.store';
	import { ui }           from '$lib/stores/ui.store';
	import { createID }     from '$lib/utils/helpers';
	import type { Record }  from '$lib/models';

	/* ------------------------------------------------------------------
	   LOCAL REACTIVE COPIES (Svelte 5 runes)
	------------------------------------------------------------------ */
	let ctx = $state(contextmenu.get());
	let sel = $state(selection.get());
	let targetRecord = $state<Record | null>(null);

	$effect(() => contextmenu.subscribe((s) => {
		console.log('[contextmenu] update', s);
		ctx = s;
	}));
	$effect(() => selection.subscribe((s) => (sel = s)));
	$effect(() => {
		targetRecord = ctx.targetId ? database.getRecordById(ctx.targetId) ?? null : null;
	});

	/* open binding for <ContextMenu> */
	let open = ctx.isVisible;
	$effect(() => (open = ctx.isVisible));

	function handleOpenChange(e: CustomEvent<boolean>) {
		if (!e.detail) contextmenu.hideContextMenu();
	}

	/* ------------------------------------------------------------------
	   ACTION HELPERS (subset; extend as you wish)
	------------------------------------------------------------------ */
	async function addRecord(rec: Record) {
		await database.addRecord(rec);
	}

	async function createRootFolder() {
		await addRecord({ id: createID(6), contentType: 'Folder' });
		modal.showAlert('Folder created', 'success');
		contextmenu.hideContextMenu();
	}

	async function createRootText() {
		await addRecord({
			id: createID(6),
			contentType: 'Extract',
			content: { ops: [{ insert: 'New text item' }] }
		});
		modal.showAlert('Text created', 'success');
		contextmenu.hideContextMenu();
	}

	async function removeItem() {
		if (!ctx.targetId) return;
		await database.removeRecordById(ctx.targetId);
		modal.showAlert('Item removed', 'success');
		contextmenu.hideContextMenu();
	}

	async function createExtract() {
		if (!sel.isSelected || !ctx.targetId) return;
		const parent = database.getRecordById(ctx.targetId);
		if (!parent) return;
		await addRecord({
			id: `${parent.id}/${createID(6)}`,
			contentType: 'Extract',
			content: { ops: [{ insert: sel.text }] }
		});
		modal.showAlert('Extract created', 'success');
		contextmenu.hideContextMenu();
	}
</script>

<!-- ------------------------------------------------------------------
     SHADCN CONTEXT‑MENU
------------------------------------------------------------------- -->
<ContextMenu {open} on:openChange={handleOpenChange} modal={false}>
	<!-- Invisible trigger positioned under the cursor -->
	<ContextMenuTrigger asChild>
		<div
			style="position:fixed; top:{ctx.y}px; left:{ctx.x}px; width:1px; height:1px;"
		/>
	</ContextMenuTrigger>

	<!-- Dynamic menu ------------------------------------------------- -->
	<ContextMenuContent class="min-w-40">
		{#if ctx.targetType === 'sidebar-background'}
			<ContextMenuItem onSelect={createRootFolder}>Create folder</ContextMenuItem>
			<ContextMenuItem onSelect={createRootText}>Create text</ContextMenuItem>
		{:else if ctx.targetType === 'sidebar-item'}
			<ContextMenuItem
				onSelect={removeItem}
				disabled={!ctx.targetId}
				variant="destructive"
			>
				Remove item
			</ContextMenuItem>
		{:else if ctx.targetType === 'content-area'}
			<ContextMenuItem
				onSelect={createExtract}
				disabled={!sel.isSelected}
			>
				Create extract
			</ContextMenuItem>
		{/if}

		<!-- separator shown if both background & item actions coexist -->
		{#if ctx.targetType === 'sidebar-item' && ctx.targetId === null}
			<ContextMenuSeparator />
		{/if}
	</ContextMenuContent>
</ContextMenu>
