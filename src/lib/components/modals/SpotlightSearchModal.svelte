<script lang="ts">
	/* ——————————————————— Imports ——————————————————— */
	import * as Command          from '$lib/components/ui/command';
	import { Button }            from '$lib/components/ui/button';
	import { database }          from '$lib/stores/database.store';
	import { modal }             from '$lib/stores/modal.store';
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

	function select(item: Record, i: number) {
		console.log('Selected item:', item);
		selectedIndex = i;
		closeSpotlight();
	}
</script>

<!-- Hot‑key listener -->
<svelte:window on:keydown={handleKeydown} />

<!-- ——————————————————— UI ——————————————————— -->
<Command.Dialog
	bind:open
	on:openChange={(e) => !e.detail && closeSpotlight()}>

	<!-- Search field — live two‑way binding triggers performSearch each keystroke -->
	<Command.Input
		id="spotlight-input"
		placeholder="Search files…"
		bind:value={query}
		on:input={() => performSearch(query)}
	/>

	<!-- Result list -->
	<Command.List>
		{#if !query}
			<Command.Empty>Start typing to search items.</Command.Empty>
		{:else if nameMatches.length === 0 && contentMatches.length === 0}
			<Command.Empty>No results found.</Command.Empty>
		{/if}

		<!-- File‑name matches -->
		{#if nameMatches.length}
			<Command.Group heading="File names">
				{#each nameMatches as item, i (item.id)}
					<Command.Item
						data-selected={i === selectedIndex}
						on:select={() => select(item, i)}>
						<FileTextIcon class="mr-2 size-4" />
						<span>{item.id}</span>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}

		<!-- Content matches -->
		{#if contentMatches.length}
			<Command.Separator />
			<Command.Group heading="File contents">
				{#each contentMatches as item, j (item.id)}
					<Command.Item
						data-selected={j + nameMatches.length === selectedIndex}
						on:select={() => select(item, j + nameMatches.length)}>
						<SearchIcon class="mr-2 size-4" />
						<div class="flex flex-col">
							<span class="font-medium">{item.id}</span>
							<span class="text-xs opacity-70">{preview(item)}</span>
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>

	<!-- Footer -->
	<div class="flex justify-end p-4 border-t">
		<Button variant="outline" size="sm" on:click={closeSpotlight}>
			Close
		</Button>
	</div>
</Command.Dialog>

<style>
	:global([cmdk-item][data-selected]) {
		background: rgb(var(--background-color));
	}
</style>
