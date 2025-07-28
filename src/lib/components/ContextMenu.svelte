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
	import { toast } from "svelte-sonner";

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
	let ctx = $state({ isVisible: false, x: 0, y: 0, targetId: null as string | null, targetType: null as 'sidebar-item' | 'sidebar-right-item' | 'content-area' | null });
	let sel = $state({ isSelected: false, text: '', range: null as { index: number; length: number } | null });
	let targetRecord = $state<Record | null>(null);

	$effect(() => {
		const unsubscribe = contextmenu.subscribe((s) => {
			console.log('[contextmenu] update', s);
			console.log('[contextmenu] coordinates', s.x, s.y);
			ctx = s;
		});
		return () => unsubscribe();
	});
	
	$effect(() => {
		const unsubscribe = selection.subscribe((s) => {
			sel = s;
		});
		return () => unsubscribe();
	});
	
	$effect(() => {
		targetRecord = ctx.targetId ? database.getRecordById(ctx.targetId) ?? null : null;
	});

	/* open binding for <ContextMenu> */
	let open = $state(false);
	$effect(() => {
		open = ctx.isVisible;
	});

	function handleOpenChange(open: boolean) {
		if (!open) contextmenu.hideContextMenu();
	}

	/* ------------------------------------------------------------------
	   ACTION HELPERS (subset; extend as you wish)
	------------------------------------------------------------------ */
	async function addRecord(rec: Record) {
		await database.addRecord(rec);
	}

	async function createRootFolder() {
		await addRecord({ id: createID(6), contentType: 'Folder' });
		toast('Folder created');
		contextmenu.hideContextMenu();
	}

	async function createRootText() {
		await addRecord({
			id: createID(6),
			contentType: 'Extract',
			content: { ops: [{ insert: 'New text item' }] }
		});
		toast('Text created');
		contextmenu.hideContextMenu();
	}

	async function removeItem() {
		if (!ctx.targetId) return;
		await database.removeRecordById(ctx.targetId);
		toast('Item removed');
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
		toast('Extract created');
		contextmenu.hideContextMenu();
	}
</script>

<!-- ------------------------------------------------------------------
     SHADCN CONTEXT‑MENU
------------------------------------------------------------------- -->
<ContextMenu {open} onOpenChange={handleOpenChange}>
	<!-- Invisible trigger positioned under the cursor -->
	<ContextMenuTrigger style="position: fixed; top: {ctx.y}px; left: {ctx.x}px; width: 1px; height: 1px; opacity: 0; z-index: 9999;">
		<div style="width: 1px; height: 1px;"></div>
	</ContextMenuTrigger>

	<!-- Dynamic menu ------------------------------------------------- -->
	<ContextMenuContent class="min-w-40">
		{#if ctx.targetType === null}
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
