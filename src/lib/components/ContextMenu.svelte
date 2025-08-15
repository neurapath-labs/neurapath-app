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
	import { Trash2Icon, FolderPlusIcon, FilePlusIcon, FlagIcon, CopyIcon, PencilIcon, FlagOffIcon, FlagOff, Flag } from "@lucide/svelte";

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
			//("[contextmenu] update", s);
			//("[contextmenu] coordinates", s.x, s.y);
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
		toast.success("Folder created");
		contextmenu.hideContextMenu();
	}

	async function createRootText() {
		await addRecord({
			id: createID(6),
			contentType: "Extract",
			content: { ops: [{ insert: "New text item" }] },
		});
		toast.success("Text created");
		contextmenu.hideContextMenu();
	}
	
	async function createFolderInFolder() {
		if (!ctx.targetId) return;
		
		const parent = database.getRecordById(ctx.targetId);
		if (!parent) return;
		
		await addRecord({
			id: `${parent.id}/${createID(6)}`,
			contentType: "Folder"
		});
		toast.success("Folder created");
		contextmenu.hideContextMenu();
	}
	
	async function createTextInFolder() {
		if (!ctx.targetId) return;
		
		const parent = database.getRecordById(ctx.targetId);
		if (!parent) return;
		
		await addRecord({
			id: `${parent.id}/${createID(6)}`,
			contentType: "Extract",
			content: { ops: [{ insert: "New text item" }] },
		});
		toast.success("Text created");
		contextmenu.hideContextMenu();
	}

	async function removeItem() {
		if (!ctx.targetId) return;
		
		// Check if the item is a folder by looking at its record
		if (targetRecord && targetRecord.contentType === "Folder") {
			// Use the new function to remove folder and all its contents
			await database.removeFolderAndContents(ctx.targetId);
			toast.success("Folder and contents removed");
		} else {
			// Remove single item as before
			await database.removeRecordById(ctx.targetId);
			toast.success("Item removed");
		}
		
		// Save the database to ensure changes are persisted
		// Note: We don't have direct access to the current user ID here
		// The database store should handle saving automatically when needed
		
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
		toast.success("Extract created");
		contextmenu.hideContextMenu();
	}

	async function flagItem() {
		if (!ctx.targetId) return;
		
		const record = database.getRecordById(ctx.targetId);
		if (!record) {
			toast.error("No record found to flag");
			return;
		}
		
		try {
			// Toggle flagged status
			const isFlagged = !(record.isFlagged || false);
			await database.updateRecordRemotely(record.id, { isFlagged });
			
			toast.success(`Item ${isFlagged ? 'flagged' : 'unflagged'} successfully`);
		} catch (error) {
			console.error('Error flagging item:', error);
			toast.error('Error flagging item');
		}
		contextmenu.hideContextMenu();
	}

	async function duplicateItem() {
		if (!ctx.targetId) return;
		
		const record = database.getRecordById(ctx.targetId);
		if (!record) {
			toast.error("No record found to duplicate");
			return;
		}
		
		try {
			// Get all items from the database
			let allItems: Record[] = [];
			const unsubscribe = database.subscribe((db) => {
				allItems = db.items;
			});
			unsubscribe();
			
			// Find all subitems of the target item
			const subItems = allItems.filter((item: Record) =>
				item.id.startsWith(`${record.id}/`)
			);
			
			// Create new ID for the duplicated item
			// Extract the parent path and item name correctly
			const pathParts = record.id.split('/');
			const itemName = pathParts.pop() || record.id;
			const parentPath = pathParts.join('/');
			const newRecordId = parentPath ? `${parentPath}/Copy of ${itemName}` : `Copy of ${itemName}`;
			
			// Create new record with duplicated content
			const newRecord: Record = {
				...record,
				id: newRecordId
			};
			
			// Add the duplicated item to database
			await database.addRecord(newRecord);
			
			// Duplicate all subitems
			for (const subItem of subItems) {
				// Create new ID for the duplicated subitem
				const relativePath = subItem.id.substring(record.id.length + 1);
				const newSubItemId = `${newRecordId}/${relativePath}`;
				
				// Create new subitem with duplicated content
				const newSubItem: Record = {
					...subItem,
					id: newSubItemId
				};
				
				// Add the duplicated subitem to database
				await database.addRecord(newSubItem);
			}
			
			toast.success('Item and subitems duplicated successfully');
		} catch (error) {
			console.error('Error duplicating item:', error);
			toast.error('Error duplicating item');
		}
		contextmenu.hideContextMenu();
	}
	
	async function renameItem() {
		if (!ctx.targetId) return;
		
		const record = database.getRecordById(ctx.targetId);
		if (!record) {
			toast.error("No record found to rename");
			return;
		}
		
		try {
			// Get the current name (last part of the ID)
			const currentName = record.id.split('/').pop() || record.id;
			
			// Prompt user for new name
			const newName = prompt("Enter new name:", currentName);
			if (newName === null) return; // User cancelled
			const sanitizedName = newName.trim();
			if (sanitizedName === currentName) return; // No change
			if (!sanitizedName) {
				toast.info("Name cannot be empty");
				return;
			}
			if (sanitizedName.includes('/')) {
				alert("Name cannot contain '/' characters.");
				return;
			}
			
			// Get all items from the database
			let allItems: Record[] = [];
			const unsubscribe = database.subscribe((db) => {
				allItems = db.items;
			});
			unsubscribe();
			
			// Find the item and its children
			const itemToRename = record;
			const childItems = allItems.filter(item =>
				item.id.startsWith(`${record.id}/`)
			);

			// Create new ID with the new name
			const parentId = record.id.includes('/')
				? record.id.substring(0, record.id.lastIndexOf('/'))
				: '';
			const newId = parentId ? `${parentId}/${sanitizedName}` : sanitizedName;

			// Prevent duplicate names within the same parent for ANY content type
			// Also ensure no child path collisions will occur after rename
			const currentSubtreeIds = new Set([record.id, ...childItems.map((c) => c.id)]);
			const existingIdsExcludingSubtree = new Set(
				allItems.filter((i) => !currentSubtreeIds.has(i.id)).map((i) => i.id)
			);
			const prospectiveIds = new Set<string>([newId]);
			for (const childItem of childItems) {
				const relativePath = childItem.id.substring(record.id.length + 1);
				prospectiveIds.add(`${newId}/${relativePath}`);
			}
			for (const id of prospectiveIds) {
				if (existingIdsExcludingSubtree.has(id)) {
					alert("An item with that name already exists in this location.");
					return;
				}
			}
			
			// Update the item and its children with new IDs
			const renamedItem = { ...itemToRename, id: newId };
			const renamedChildren = childItems.map(childItem => {
				const relativePath = childItem.id.substring(record.id.length + 1);
				const childNewId = `${newId}/${relativePath}`;
				return { ...childItem, id: childNewId };
			});
			
			// Update the database with renamed items atomically to preserve metadata
			// Remove old items locally without triggering parent cloze updates for cloze children
			await database.removeRecordById(itemToRename.id, { skipParentClozeUpdate: true });
			for (const childItem of childItems) {
				await database.removeRecordById(childItem.id, { skipParentClozeUpdate: true });
			}
			// Add the renamed items
			await database.addRecord(renamedItem);
			for (const renamedChild of renamedChildren) {
				await database.addRecord(renamedChild);
			}
			
			toast.success('Item and subitems renamed successfully');
		} catch (error) {
			console.error('Error renaming item:', error);
			toast.error('Error renaming item');
		}
		contextmenu.hideContextMenu();
	}
</script>

<!-- ------------------------------------------------------------------
     SHADCN CONTEXT‑MENU
------------------------------------------------------------------- -->
<!-- Dynamic menu ------------------------------------------------- -->
<div
	class="min-w-40 rounded-md border p-1 shadow-md z-50 bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] border-[rgb(var(--background-color))]"
	style="position: fixed; top: {ctx.y}px; left: {ctx.x}px; display: {ctx.isVisible
		? 'block'
		: 'none'};"
>
	{#if ctx.targetType === null || ctx.targetType === "sidebar-background"}
			<button
			class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm rounded cursor-pointer hover:bg-[rgba(var(--background-color_button),0.18)] hover:text-[rgb(var(--font-color))]"
			onclick={createRootText}
		>
			<FilePlusIcon class="h-4 w-4" />
			<span>Create text</span>
		</button>
		<button
			class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm rounded cursor-pointer hover:bg-[rgba(var(--background-color_button),0.18)] hover:text-[rgb(var(--font-color))]"
			onclick={createRootFolder}
		>
			<FolderPlusIcon class="h-4 w-4" />
			<span>Create folder</span>
		</button>
	{:else if ctx.targetType === "sidebar-item" || ctx.targetType === "content-area"}
		<!-- Create folder and text options for folders -->
		{#if targetRecord && targetRecord.contentType === "Folder"}
			<button
				class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm rounded cursor-pointer hover:bg-[rgba(var(--background-color_button),0.18)] hover:text-[rgb(var(--font-color))]"
				onclick={createFolderInFolder}
				disabled={!ctx.targetId}
			>
				<FolderPlusIcon class="h-4 w-4" />
				<span>Create folder</span>
			</button>
			<button
				class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm rounded cursor-pointer hover:bg-[rgba(var(--background-color_button),0.18)] hover:text-[rgb(var(--font-color))]"
				onclick={createTextInFolder}
				disabled={!ctx.targetId}
			>
				<FilePlusIcon class="h-4 w-4" />
				<span>Create text</span>
			</button>
			<div class="h-px bg-border my-1"></div>
		{/if}
		
		<button
			class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm rounded cursor-pointer hover:bg-[rgba(var(--background-color_button),0.18)] hover:text-[rgb(var(--font-color))]"
			onclick={flagItem}
			disabled={!ctx.targetId}
		>
			
			{#if targetRecord?.isFlagged}
				<FlagOff class="h-4 w-4" />
				<span>Unflag item</span>
			{:else}
				<Flag class="h-4 w-4" />
				<span>Flag item</span>
			{/if}
		</button>
		<button
			class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm rounded cursor-pointer hover:bg-[rgba(var(--background-color_button),0.18)] hover:text-[rgb(var(--font-color))]"
			onclick={duplicateItem}
			disabled={!ctx.targetId}
		>
			<CopyIcon class="h-4 w-4" />
			<span>Duplicate item</span>
		</button>
		<button
			class="flex items-center gap-2 w-full text-left px-2 py-1 text-sm rounded cursor-pointer hover:bg-[rgba(var(--background-color_button),0.18)] hover:text-[rgb(var(--font-color))]"
			onclick={renameItem}
			disabled={!ctx.targetId}
		>
			<PencilIcon class="h-4 w-4" />
			<span>Rename item</span>
		</button>
		<button
			class="flex items-center gap-2 w-full text left px-2 py-1 text-sm rounded cursor-pointer hover:bg-[rgba(var(--background-color_button),0.18)] hover:text-[rgb(var(--font-color))] text-red-500"
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
