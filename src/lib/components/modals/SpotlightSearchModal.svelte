<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { database } from '$lib/stores/database.store';
  import { modal } from '$lib/stores/modal.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy, tick } from 'svelte';
  import SearchIcon from '@lucide/svelte/icons/search';

  let searchQuery: string = $state('');
  let searchResults: Record[] = $state([]);
  let isOpen: boolean = $state(false);
  let selectedIndex: number = $state(-1);

  let unsubscribeDatabase: () => void;
  let unsubscribeModal: () => void;

  onMount(() => {
    unsubscribeDatabase = database.subscribe(($database) => {
      if (searchQuery) performSearch(searchQuery);
    });

    unsubscribeModal = modal.subscribe(($modal) => {
      isOpen = $modal.isSpotlightSearchModalOpen;
      if (isOpen) {
        searchQuery = '';
        searchResults = [];
        selectedIndex = -1;
        tick().then(() => {
          document.getElementById('spotlight-search-input')?.focus();
        });
      }
    });
  });

  onDestroy(() => {
    if (unsubscribeDatabase) unsubscribeDatabase();
    if (unsubscribeModal) unsubscribeModal();
  });

  function closeSpotlightSearch() {
    modal.closeSpotlightSearchModal();
  }

  function performSearch(query: string) {
    searchQuery = query;
    if (!query.trim()) {
      searchResults = [];
      selectedIndex = -1;
      return;
    }

    const lower = query.toLowerCase();
    let items: Record[] = [];
    const unsub = database.subscribe(($db) => (items = $db.items));
    unsub();

    searchResults = items.filter((item) => {
      if (item.id?.toLowerCase().includes(lower)) return true;
      if ((item.contentType === 'Extract' || item.contentType === 'Cloze') && item.content?.ops) {
        const txt = item.content.ops.filter((op: any) => typeof op.insert === 'string').map((op: any) => op.insert).join('');
        return txt.toLowerCase().includes(lower);
      }
      return false;
    });
    selectedIndex = -1;
  }

  function handleInput(e: Event) {
    performSearch((e.target as HTMLInputElement).value);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (searchResults.length) selectedIndex = (selectedIndex + 1) % searchResults.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (searchResults.length) selectedIndex = selectedIndex <= 0 ? searchResults.length - 1 : selectedIndex - 1;
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) selectItem(searchResults[selectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        closeSpotlightSearch();
        break;
    }
  }

  function selectItem(item: Record) {
    ('Selected item:', item);
    closeSpotlightSearch();
  }

  function getContentPreview(item: Record) {
    if (item.contentType === 'Folder') return 'Folder';
    if ((item.contentType === 'Extract' || item.contentType === 'Cloze') && item.content?.ops) {
      const txt = item.content.ops.filter((op: any) => typeof op.insert === 'string').map((op: any) => op.insert).join('');
      return txt.slice(0, 100) + (txt.length > 100 ? '...' : '');
    }
    return '';
  }
</script>

{#if isOpen}
  <div id="modalbox-spotlight" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[500px] h-[400px] p-8 border border-[rgb(var(--background-color))] rounded grid grid-rows-[auto_auto_1fr_auto] overflow-hidden">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-4">
        <SearchIcon class="w-[72px] h-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Spotlight Search</span>
      </div>

      <!-- Search input -->
      <div class="mb-4">
        <input
          id="spotlight-search-input"
          type="text"
          placeholder="Type to search..."
          value={searchQuery}
          oninput={handleInput}
          onkeydown={handleKeydown}
          class="w-full px-4 py-3 text-base rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color))] text-[rgb(var(--font-color))] focus:outline-none focus:border-[rgb(var(--font-color))]"
        />
      </div>

      <!-- Results -->
      <div class="overflow-y-auto mb-4 pr-2 mr-[-8px]">
        {#if searchResults.length === 0 && searchQuery}
          <div class="text-center py-5 text-sm text-[rgba(var(--font-color),0.7)]">No results found</div>
        {:else if searchResults.length > 0}
          <ul class="divide-y divide-[rgb(var(--background-color))]">
            {#each searchResults as item, i}
              <button
                type="button"
                class="p-3 cursor-pointer hover:bg-[rgb(var(--background-color))] text-sm w-full text-left {i === selectedIndex ? 'bg-[rgb(var(--background-color))]' : ''}"
                onclick={() => selectItem(item)}
              >
                <div class="font-semibold mb-1">{item.id}</div>
                <div class="text-[rgba(var(--font-color),0.7)]">{getContentPreview(item)}</div>
              </button>
            {/each}
          </ul>
        {:else}
          <div class="text-center py-5 text-sm text-[rgba(var(--font-color),0.7)]">Start typing to search items</div>
        {/if}
      </div>

      <!-- Close button -->
      <div class="flex justify-end">
        <Button
          type="button"
          onclick={closeSpotlightSearch}
          variant="outline"
          size="sm"
        >
          Close
        </Button>
      </div>
    </div>
  </div>
{/if}