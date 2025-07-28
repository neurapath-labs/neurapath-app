<script lang="ts">
	/* ------------------------------------------------------------------
	   STORES & HELPERS
	------------------------------------------------------------------ */
	import {
		ContextMenu,
		ContextMenuTrigger,
		ContextMenuContent,
		ContextMenuItem,
		ContextMenuSeparator,
	} from "$lib/components/ui/context-menu";
	import { toast } from "svelte-sonner";

	import { contextmenu } from "$lib/stores/contextmenu.store";
	import { selection } from "$lib/stores/selection.store";
	import { database } from "$lib/stores/database.store";
	import { modal } from "$lib/stores/modal.store";
	import { ui } from "$lib/stores/ui.store";
	import { createID } from "$lib/utils/helpers";
	import type { Record } from "$lib/models";
	import { Trash2Icon, FolderPlusIcon, FilePlusIcon } from "@lucide/svelte";

	/* ------------------------------------------------------------------
	   LOCAL REACTIVE COPIES (Svelte 5 runes)
	------------------------------------------------------------------ */
	let ctx = $state({
		isVisible: false,
		x: 0,
		y: 0,
		targetId: null as string | null,
		targetType: null as
			| "sidebar-item"
			| "sidebar-right-item"
			| "content-area"
			| "sidebar-background"
			| null,
	});
	let sel = $state({
		isSelected: false,
		text: "",
		range: null as { index: number; length: number } | null,
	});
	let targetRecord = $state<Record | null>(null);

	$effect(() => {
		const unsubscribe = contextmenu.subscribe((s) => {
			console.log("[contextmenu] update", s);
			console.log("[contextmenu] coordinates", s.x, s.y);
			ctx = s;
		});
		return () => unsubscribe();
	});

	// Close context menu when clicking outside
	function handleClickOutside(e: MouseEvent) {
		if (ctx.isVisible) {
			contextmenu.hideContextMenu();
		}
	}

	$effect(() => {
		if (ctx.isVisible) {
			document.addEventListener("click", handleClickOutside);
		} else {
			document.removeEventListener("click", handleClickOutside);
		}
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	});

	$effect(() => {
		const unsubscribe = selection.subscribe((s) => {
			sel = s;
		});
		return () => unsubscribe();
	});

	$effect(() => {
		targetRecord = ctx.targetId
			? (database.getRecordById(ctx.targetId) ?? null)
			: null;
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
		await addRecord({ id: createID(6), contentType: "Folder" });
		toast("Folder created");
		contextmenu.hideContextMenu();
	}

	async function createRootText() {
		await addRecord({
			id: createID(6),
			contentType: "Extract",
			content: { ops: [{ insert: "New text item" }] },
		});
		toast("Text created");
		contextmenu.hideContextMenu();
	}

	async function removeItem() {
		if (!ctx.targetId) return;
		await database.removeRecordById(ctx.targetId);
		toast("Item removed");
		contextmenu.hideContextMenu();
	}

	async function createExtract() {
		if (!sel.isSelected || !ctx.targetId) return;
		const parent = database.getRecordById(ctx.targetId);
		if (!parent) return;
		await addRecord({
			id: `${parent.id}/${createID(6)}`,
			contentType: "Extract",
			content: { ops: [{ insert: sel.text }] },
		});
		toast("Extract created");
		contextmenu.hideContextMenu();
	}
</script>

<!-- ------------------------------------------------------------------
     SHADCN CONTEXT‑MENU
------------------------------------------------------------------- -->
<!-- Dynamic menu ------------------------------------------------- -->
<div
	class="min-w-40 bg-popover text-popover-foreground rounded-md border p-1 shadow-md z-50"
	style="position: fixed; top: {ctx.y}px; left: {ctx.x}px; display: {ctx.isVisible
		? 'block'
		: 'none'};"
>
	{#if ctx.targetType === null || ctx.targetType === "sidebar-background"}
		<button
			class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
			onclick={createRootFolder}
		>
			<FolderPlusIcon class="h-4 w-4" />
			<span>Create folder</span>
		</button>
		<button
			class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
			onclick={createRootText}
		>
			<FilePlusIcon class="h-4 w-4" />
			<span>Create text</span>
		</button>
	{:else if ctx.targetType === "sidebar-item" || ctx.targetType === "content-area"}
		<button
			class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer text-red-500"
			onclick={removeItem}
			disabled={!ctx.targetId}
		>
			<Trash2Icon class="h-4 w-4" />
			<span>Delete item</span>
		</button>
	{/if}

	<!-- separator shown if both background & item actions coexist -->
	{#if ctx.targetType === "sidebar-item" && ctx.targetId === null}
		<div class="h-px bg-border my-1"></div>
	{/if}
</div>
