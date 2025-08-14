<script lang="ts">
	/* ——————————————————— Imports ——————————————————— */
	import * as Dialog           from '$lib/components/ui/dialog';
	import { Button }            from '$lib/components/ui/button';
	import { Input }             from '$lib/components/ui/input';
	import { database }          from '$lib/stores/database.store';
	import { modal }             from '$lib/stores/modal.store';
	import { ui }                from '$lib/stores/ui.store';
	import { learning }          from '$lib/stores/learning.store';
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

	// Command mode state
	interface CommandItem {
		id: string;
		label: string;
		description?: string;
		run: () => void | Promise<void>;
	}
	let isCommandMode       = $state(false);
	let allCommands: CommandItem[] = [
		{ id: 'open-explorer',      label: 'Open Explorer',        run: () => ui.openExplorer() },
		{ id: 'open-flagged',       label: 'Open Flagged',         run: () => ui.openFlagged() },
		{ id: 'open-statistics',    label: 'Open Statistics',      run: () => ui.openStatistics() },
		{ id: 'open-databases',     label: 'Open Databases',       run: () => ui.openDatabases() },
		{ id: 'open-settings',      label: 'Open Settings',        run: () => modal.openSettingsModal() },
		{ id: 'open-tutorial',      label: 'Open Tutorial',        run: () => ui.openTutorial() },
		{ id: 'open-pdf-import',    label: 'Open PDF Import',      run: () => ui.openPdfImport() },
		{ id: 'open-export-import', label: 'Open Export/Import',   run: () => ui.openExportImport() },
		{ id: 'toggle-practice',    label: 'Toggle Practice Mode', run: () => learning.toggleLearningMode() },
		{ id: 'close-spotlight',    label: 'Close Spotlight',      run: () => modal.closeSpotlightSearchModal() },
	];
	let filteredCommands    = $state<CommandItem[]>([]);

	let unsubDB  : () => void;
	let unsubMod : () => void;
	let unsubUI  : () => void;

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
				tick().then(() => {
					// Check if there's a pre-filled search term from global typing
					const currentUI = get(ui);
					if (currentUI.searchTerm) {
						query = currentUI.searchTerm;
						performSearch(query);
					}
					document.getElementById('spotlight-input')?.focus();
				});
			}
		});

		/* 3. UI store subscription for search term updates */
		unsubUI = ui.subscribe(($ui) => {
			if (open && $ui.searchTerm && $ui.searchTerm !== query) {
				query = $ui.searchTerm;
				performSearch(query);
			}
		});
	});

	onDestroy(() => {
		unsubDB?.();
		unsubMod?.();
		unsubUI?.();
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

	/* ——————————————————— Keyboard navigation ——————————————————— */
	function handleInputKeydown(e: KeyboardEvent) {
		const totalResults = isCommandMode
			? filteredCommands.length
			: nameMatches.length + contentMatches.length;
		
		if (totalResults === 0) return;

		switch (e.key) {
			case 'Tab':
				e.preventDefault();
				if (e.shiftKey) {
					// Shift+Tab: move up
					selectedIndex = selectedIndex <= 0 ? totalResults - 1 : selectedIndex - 1;
				} else {
					// Tab: move down
					selectedIndex = selectedIndex >= totalResults - 1 ? 0 : selectedIndex + 1;
				}
				break;
				
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = selectedIndex >= totalResults - 1 ? 0 : selectedIndex + 1;
				break;
				
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = selectedIndex <= 0 ? totalResults - 1 : selectedIndex - 1;
				break;
				
			case 'Enter':
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < totalResults) {
					if (isCommandMode) {
						selectCommand(selectedIndex);
					} else {
						const item = selectedIndex < nameMatches.length 
							? nameMatches[selectedIndex] 
							: contentMatches[selectedIndex - nameMatches.length];
						select(item, selectedIndex);
					}
				}
				break;
				
			case 'Escape':
				e.preventDefault();
				closeSpotlight();
				break;
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
		// Clear any search term when closing
		ui.setSearchTerm(null);
	}

	function performSearch(
		q: string,
		items: Record[] = get(database).items ?? []
	) {
		query = q;
		selectedIndex = -1;

		// Detect command-mode when first character is '>'
		if (q.startsWith('>')) {
			isCommandMode = true;
			const cmd = q.slice(1).trim().toLowerCase();
			if (cmd.length === 0) {
				filteredCommands = allCommands;
			} else {
				filteredCommands = allCommands.filter((c) =>
					c.label.toLowerCase().includes(cmd) || c.id.toLowerCase().includes(cmd)
				);
			}
			if (filteredCommands.length > 0) selectedIndex = 0;
			return;
		} else {
			isCommandMode = false;
			filteredCommands = [];
		}

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
		
		// Set the first result as selected if there are any results
		if (names.length > 0 || contents.length > 0) {
			selectedIndex = 0;
		}
	}

	function selectCommand(i: number) {
		if (i < 0 || i >= filteredCommands.length) return;
		const cmd = filteredCommands[i];
		try {
			cmd.run();
		} finally {
			closeSpotlight();
		}
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
        // Escape HTML first to avoid injecting markup from content
        const escapeHtml = (s: string) => s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const safe = escapeHtml(text);
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return safe.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
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
		
		selectedIndex = i;
		
		// Set the active item in the UI store to render content in quill
		ui.setActiveItemId(item.id);
		
		// Pass the search term to the UI store for cursor positioning
		if (query.trim()) {
			ui.setSearchTerm(query.trim());
		}
		
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
				placeholder="Search files or content…"
				bind:value={query}
				oninput={() => performSearch(query)}
				onkeydown={handleInputKeydown}
                class="px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))] text-sm mb-4 dark:text-[rgb(var(--night-font-color))] dark:border-[rgb(var(--background-color))]"
			/>
			
			<!-- Result list -->
            <div class="flex-1 overflow-y-auto rounded border border-[rgb(var(--background-color))]">
				<table class="w-full text-sm">
					<tbody>
						{#if isCommandMode}
							{#if filteredCommands.length === 0}
								<tr>
									<td class="p-3">No matching commands.</td>
								</tr>
							{:else}
								<tr class="border-b border-[rgb(var(--background-color))]">
									<th class="p-3 text-left font-semibold">Commands</th>
								</tr>
								{#each filteredCommands as cmd, k (cmd.id)}
									<tr
										class="border-b border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color),0.2)] cursor-pointer {k === selectedIndex ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' : ''}"
										onclick={() => selectCommand(k)}
									>
										<td class="p-3">
											<span class="font-medium">{cmd.label}</span>
											{#if cmd.description}
												<div class="text-xs opacity-70">{cmd.description}</div>
											{/if}
										</td>
									</tr>
								{/each}
							{/if}
						{:else if !query}
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
									class="border-b border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color),0.2)] cursor-pointer {i === selectedIndex ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' : ''}"
									onclick={() => select(item, i)}
								>
									<td class="p-3">
										<div class="flex items-center">
											<FileTextIcon class="mr-2 size-4" />
                                            <span>{@html highlightText(item.id, query)}</span>
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
									class="border-b border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color),0.2)] cursor-pointer {j + nameMatches.length === selectedIndex ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' : ''}"
									onclick={() => select(item, j + nameMatches.length)}
								>
									<td class="p-3">
										<div class="flex flex-col">
                                            <span class="font-medium">{@html highlightText(item.id, query)}</span>
                                            <span class="text-xs opacity-70">{@html highlightText(preview(item), query)}</span>
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
