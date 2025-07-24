<script lang="ts">
  import { database } from '$lib/stores/database.store';
  import { modal } from '$lib/stores/modal.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';
  import { tick } from 'svelte';

  // Using Svelte 5 runes for reactivity
  let searchQuery: string = $state('');
  let searchResults: Record[] = $state([]);
  let isOpen: boolean = $state(false);
  let selectedIndex: number = $state(-1);

  // Subscribe to database and modal changes
  let unsubscribeDatabase: () => void;
  let unsubscribeModal: () => void;

  onMount(() => {
    // Subscribe to database changes
    unsubscribeDatabase = database.subscribe(($database) => {
      // When database changes, update search results if there's a query
      if (searchQuery) {
        performSearch(searchQuery);
      }
    });

    // Subscribe to modal changes
    unsubscribeModal = modal.subscribe(($modal) => {
      isOpen = $modal.isSpotlightSearchModalOpen;
      if (isOpen) {
        // Reset search when modal opens
        searchQuery = '';
        searchResults = [];
        selectedIndex = -1;
        // Focus the search input after the modal is rendered
        tick().then(() => {
          const searchInput = document.getElementById('spotlight-search-input');
          if (searchInput) {
            searchInput.focus();
          }
        });
      }
    });
  });

  onDestroy(() => {
    if (unsubscribeDatabase) unsubscribeDatabase();
    if (unsubscribeModal) unsubscribeModal();
  });

  // Function to close the spotlight search modal
  function closeSpotlightSearch() {
    modal.closeSpotlightSearchModal();
  }

  // Function to perform search
  function performSearch(query: string) {
    searchQuery = query;
    
    if (!query.trim()) {
      searchResults = [];
      selectedIndex = -1;
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    
    // Get all items from database
    let allItems: Record[] = [];
    const unsubscribe = database.subscribe(($database) => {
      allItems = $database.items;
    });
    unsubscribe(); // Immediately unsubscribe since we just need the current state
    
    // Filter items based on query
    searchResults = allItems.filter((item: Record) => {
      // Search in item id (title)
      if (item.id && item.id.toLowerCase().includes(lowerCaseQuery)) {
        return true;
      }
      
      // Search in item content for Extract and Cloze types
      if ((item.contentType === 'Extract' || item.contentType === 'Cloze') && item.content) {
        // For Quill content, search in the text
        if (item.content.ops) {
          const contentText = item.content.ops
            .filter((op: any) => typeof op.insert === 'string')
            .map((op: any) => op.insert)
            .join('');
          if (contentText.toLowerCase().includes(lowerCaseQuery)) {
            return true;
          }
        }
      }
      
      return false;
    });
    
    // Reset selected index
    selectedIndex = -1;
  }

  // Function to handle input changes
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    performSearch(target.value);
  }

  // Function to handle keydown events
  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (searchResults.length > 0) {
          selectedIndex = (selectedIndex + 1) % searchResults.length;
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (searchResults.length > 0) {
          selectedIndex = selectedIndex <= 0 ? searchResults.length - 1 : selectedIndex - 1;
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          selectItem(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        closeSpotlightSearch();
        break;
    }
  }

  // Function to select an item
  function selectItem(item: Record) {
    // For now, just close the modal
    // In a full implementation, this would navigate to the item
    console.log('Selected item:', item);
    closeSpotlightSearch();
  }

  // Function to get a preview of the content
  function getContentPreview(item: Record): string {
    if (item.contentType === 'Folder') {
      return 'Folder';
    }
    
    if ((item.contentType === 'Extract' || item.contentType === 'Cloze') && item.content) {
      if (item.content.ops) {
        const contentText = item.content.ops
          .filter((op: any) => typeof op.insert === 'string')
          .map((op: any) => op.insert)
          .join('');
        // Return first 100 characters
        return contentText.substring(0, 100) + (contentText.length > 100 ? '...' : '');
      }
    }
    
    return '';
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-spotlight">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/loupe.svg" alt="Search icon" />
      <span class="modalbox-title">Spotlight Search</span>
    </div>
    <div class="search-container">
      <input
        id="spotlight-search-input"
        class="search-input"
        type="text"
        placeholder="Type to search..."
        value={searchQuery}
        on:input={handleInput}
        on:keydown={handleKeydown}
      />
    </div>
    <div class="results-container">
      {#if searchResults.length === 0 && searchQuery}
        <div class="no-results">No results found</div>
      {:else if searchResults.length > 0}
        <ul class="results-list">
          {#each searchResults as item, i}
            <li
              class="result-item"
              class:selected={i === selectedIndex}
              on:click={() => selectItem(item)}
            >
              <div class="item-title">{item.id}</div>
              <div class="item-preview">{getContentPreview(item)}</div>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="search-hint">Start typing to search items</div>
      {/if}
    </div>
    <button class="modalbox-button" on:click={closeSpotlightSearch} type="button">Close</button>
  </div>
{/if}

<style>
  .modalbox {
    position: absolute;
    overflow: hidden;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 500px;
    height: 400px;
    left: 50%;
    top: 50%;
    margin-left: -250px;
    margin-top: -200px;
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    padding: 32px;
    border: 1px solid rgb(var(--background-color));
    border-radius: 4px;
    z-index: 10;
  }

  .modalbox-header {
    font-size: 26px;
    margin-bottom: 20px;
    display: grid;
    grid-template-columns: min-content;
    grid-template-rows: min-content min-content;
    text-align: center;
    align-self: center;
    align-items: center;
    align-content: center;
    justify-content: center;
    justify-self: center;
    justify-items: center;
    grid-gap: 10px;
  }

  .modalbox-icon {
    text-align: center;
    width: 72px;
  }

  .modalbox-title {
    font-size: inherit;
    text-align: center;
    margin-bottom: 10px;
    white-space: nowrap;
  }

  .search-container {
    margin-bottom: 20px;
  }

  .search-input {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    border: 1px solid rgb(var(--background-color));
    border-radius: 4px;
    background-color: rgb(var(--background-color));
    color: rgb(var(--font-color));
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: rgb(var(--font-color));
  }

  .results-container {
    overflow-y: auto;
    margin-bottom: 20px;
  }

  .results-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .result-item {
    padding: 12px;
    border-bottom: 1px solid rgb(var(--background-color));
    cursor: pointer;
  }

  .result-item:hover,
  .result-item.selected {
    background-color: rgb(var(--background-color));
  }

  .item-title {
    font-weight: bold;
    margin-bottom: 4px;
  }

  .item-preview {
    font-size: 14px;
    color: rgba(var(--font-color), 0.7);
  }

  .no-results,
  .search-hint {
    text-align: center;
    padding: 20px;
    color: rgba(var(--font-color), 0.7);
  }

  .modalbox-button {
    border-color: rgb(var(--background-color));
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    padding: 10px 15px;
    text-align: center;
    border-radius: 4px;
    align-self: center;
  }

  .modalbox-button:hover {
    background-color: rgba(var(--background-color_button-hover));
    cursor: pointer;
  }

  .visible {
    display: block !important;
  }

  .hidden {
    display: none !important;
  }
</style>