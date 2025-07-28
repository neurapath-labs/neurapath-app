<script lang="ts">
	/* ——————————————————— Imports ——————————————————— */
	import * as Dialog           from '$lib/components/ui/dialog';
	import { Button }            from '$lib/components/ui/button';
	import { Input }             from '$lib/components/ui/input';
	import { database }          from '$lib/stores/database.store';
	import { modal }             from '$lib/stores/modal.store';
	import { ui }                from '$lib/stores/ui.store';
	import type { Record }       from '$lib/models';

	import FileTextIcon          from '@lucide/svelte/icons/file-text';
	import SearchIcon            from '@lucide/svelte/icons/search';

	import { onMount, onDestroy, tick } from 'svelte';
	import { get } from 'svelte/store';

	/* ——————————————————— Local state (Svelte 5 runes) ——————————————————— */
	let query           = $state('');
	let nameMatches     = $state<Record[]>([]);
	let contentMatches  = $state<Record[]>([]);
	let selectedIndex   = $state(-1);
	let open            = $state(false);

	let unsubDB  : () => void;
	let unsubMod : () => void;

	/* ——————————————————— Lifecycle ——————————————————— */
	onMount(() => {
		/* 1. keep results live when DB changes */
		unsubDB = database.subscribe(($db) => {
			/* re‑run search with the latest items, if we already have a query */
			if (query) performSearch(query, $db.items);
		});

		/* 2. modal store drives dialog visibility */
		unsubMod = modal.subscribe(($m) => {
			open = $m.isSpotlightSearchModalOpen;
			if (open) {
				reset();
				tick().then(() =>
					document.getElementById('spotlight-input')?.focus()
				);
			}
		});
	});

	onDestroy(() => {
		unsubDB?.();
		unsubMod?.();
	});

	/* ——————————————————— Hot‑key (⌘/Ctrl + J) ——————————————————— */
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open
				? modal.closeSpotlightSearchModal()
				: modal.openSpotlightSearchModal?.();
		}
	}

	/* ——————————————————— Helpers ——————————————————— */
	function reset() {
		query = '';
		nameMatches = [];
		contentMatches = [];
		selectedIndex = -1;
	}

	function closeSpotlight() {
		modal.closeSpotlightSearchModal();
	}

	function performSearch(
		q: string,
		items: Record[] = get(database).items ?? []
	) {
		query = q;
		selectedIndex = -1;

		if (!q.trim()) {
			nameMatches = [];
			contentMatches = [];
			return;
		}

		const lower       = q.toLowerCase();
		const names:    Record[] = [];
		const contents: Record[] = [];

		for (const item of items) {
			const inName = item.id?.toLowerCase().includes(lower);
			let   inContent = false;

			if (
				(item.contentType === 'Extract' || item.contentType === 'Cloze') &&
				item.content?.ops
			) {
				const txt = item.content.ops
					.filter((op: any) => typeof op.insert === 'string')
					.map((op: any) => op.insert)
					.join('');
				inContent = txt.toLowerCase().includes(lower);
			}

			if (inName) names.push(item);
			else if (inContent) contents.push(item);
		}

		/* re‑assign so Svelte reacts */
		nameMatches    = names;
		contentMatches = contents;
	}

	function preview(item: Record) {
		if (
			(item.contentType === 'Extract' || item.contentType === 'Cloze') &&
			item.content?.ops
		) {
			const txt = item.content.ops
				.filter((op: any) => typeof op.insert === 'string')
				.map((op: any) => op.insert)
				.join('');
			return txt.slice(0, 100) + (txt.length > 100 ? '…' : '');
		}
		return '';
	}
	
	function highlightText(text: string, searchTerm: string): string {
		if (!searchTerm) return text;
		
		const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
	}
	
	function highlightItemText(item: Record, searchTerm: string): string {
		let text = item.id || '';
		
		if (
			(item.contentType === 'Extract' || item.contentType === 'Cloze') &&
			item.content?.ops
		) {
			const contentText = item.content.ops
				.filter((op: any) => typeof op.insert === 'string')
				.map((op: any) => op.insert)
				.join('');
			text += ' ' + contentText;
		}
		
		return highlightText(text, searchTerm);
	}

	function select(item: Record, i: number) {
		console.log('Selected item:', item);
		selectedIndex = i;
		
		// Set the active item in the UI store to render content in quill
		ui.setActiveItemId(item.id);
		
		closeSpotlight();
	}
	
	function handleOpenChange(openState: boolean) {
		if (!openState) {
			closeSpotlight();
		}
	}
</script>

<!-- Hot‑key listener -->
<svelte:window on:keydown={handleKeydown} />

<!-- ——————————————————— UI ——————————————————— -->
<Dialog.Root bind:open={open} onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-transparent z-50" />
		
		<Dialog.Content
			class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] max-h-[90vh]
						 grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border
						 border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))]
						 text-[rgb(var(--font-color))] p-6 shadow-lg focus:outline-none z-50"
		>
			<!-- Header -->
			<div class="flex items-center gap-3 mb-4">
				<SearchIcon class="w-9 h-9" />
				<h1 class="text-xl font-semibold">Spotlight Search</h1>
			</div>
			
			<!-- Search field — live two‑way binding triggers performSearch each keystroke -->
			<Input
				id="spotlight-input"
				placeholder="Search files…"
				bind:value={query}
				oninput={() => performSearch(query)}
				class="px-3 py-2 rounded border border-[rgb(var(--background-color))]
							 bg-[rgb(var(--background-color_input))] text-sm mb-4"
			/>
			
			<!-- Result list -->
			<div class="flex-1 overflow-y-auto rounded border border-[rgb(var(--background-color))]">
				<table class="w-full text-sm">
					<tbody>
						{#if !query}
							<tr>
								<td class="p-3">Start typing to search items.</td>
							</tr>
						{:else if nameMatches.length === 0 && contentMatches.length === 0}
							<tr>
								<td class="p-3">No results found.</td>
							</tr>
						{/if}
						
						<!-- File‑name matches -->
						{#if nameMatches.length}
							<tr class="border-b border-[rgb(var(--background-color))]">
								<th class="p-3 text-left font-semibold">File names</th>
							</tr>
							{#each nameMatches as item, i (item.id)}
								<tr
									class="border-b border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color),0.2)] cursor-pointer {i === selectedIndex ? 'bg-[rgba(var(--background-color),0.2)]' : ''}"
									on:click={() => select(item, i)}
								>
									<td class="p-3">
										<div class="flex items-center">
											<FileTextIcon class="mr-2 size-4" />
											<span>{item.id}</span>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
						
						<!-- Content matches -->
						{#if contentMatches.length}
							<tr class="border-b border-[rgb(var(--background-color))]">
								<th class="p-3 text-left font-semibold">File contents</th>
							</tr>
							{#each contentMatches as item, j (item.id)}
								<tr
									class="border-b border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color),0.2)] cursor-pointer {j + nameMatches.length === selectedIndex ? 'bg-[rgba(var(--background-color),0.2)]' : ''}"
									on:click={() => select(item, j + nameMatches.length)}
								>
									<td class="p-3">
										<div class="flex flex-col">
											<span class="font-medium">{item.id}</span>
											<span class="text-xs opacity-70">{preview(item)}</span>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* Remove the old cmdk styles since we're not using Command components anymore */
</style>
