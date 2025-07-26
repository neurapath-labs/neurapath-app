<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { profile } from '$lib/stores/profile.store';
  import { selection } from '$lib/stores/selection.store';
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { modal } from '$lib/stores/modal.store';
  
  let similarContent: any[] = [];
  let isLoading = false;
  let showRightSidebar = true;
  let selectionData: any = {};
  let lastRightClickedSimilarContentID: string | null = null;
  let relatedWords: any[] = [];
  let wikipediaArticles: any[] = [];
  
  const unsubscribe = profile.subscribe(($profile) => {
    showRightSidebar = $profile.showRightSidebar ?? true;
  });
  
  const unsubscribeSelection = selection.subscribe(($selection) => {
    selectionData = $selection;
    if ($selection.isSelected) {
      searchSimilarContent($selection.text);
      searchRelatedWords($selection.text);
      searchWikipedia($selection.text);
    }
  });
  
  onDestroy(() => {
    unsubscribe();
    unsubscribeSelection();
  });
  
  /* …your search‑/helper functions stay exactly the same… */
</script>

<aside
  id="sidebar-right"
  class:hidden={!showRightSidebar}
  class="block overflow-auto [grid-area:similar] p-[var(--rightSidebar-padding)] opacity-[var(--zen-opacity)] hover:opacity-100 transition-opacity duration-150"
>
  <!-- wrapper to give sections some vertical rhythm -->
  <div class="space-y-6">

    <!-- ───────────── Similar Content ───────────── -->
    <div class="sidebar-section">
      <h5 class="mt-0 text-base font-semibold">Similar Content</h5>

      {#if isLoading}
        <div class="text-center p-4 text-[rgb(var(--font-color))]">Loading…</div>

      {:else if similarContent.length > 0}
        <div class="space-y-2">
          {#each similarContent as item}
            <div
              class="cursor-pointer text-[rgb(var(--font-color))] p-2 rounded bg-[rgba(var(--background-color_modalbox),0.5)] hover:bg-[rgba(var(--background-color_modalbox),1)]"
              on:click={() => handleItemClick(item)}
              on:contextmenu={(e) => handleContextMenu(e, item.id)}
            >
              <h6 class="m-0 mb-1 text-sm font-semibold">{item.title}</h6>
              <p  class="m-0 text-xs">{item.content}</p>
            </div>
          {/each}
        </div>

      {:else}
        <div class="text-center p-4 text-[rgb(var(--font-color))]">
          Select text to find similar content
        </div>
      {/if}
    </div>

    <!-- ───────────── Related Words ───────────── -->
    <div class="sidebar-section">
      <h5 class="mt-0 text-base font-semibold">Related Words</h5>

      {#if relatedWords.length > 0}
        <div class="space-y-1">
          {#each relatedWords as word}
            <div
              class="cursor-pointer text-[rgb(var(--font-color))] hover:underline"
              on:click={() => copyToClipboard(word.word)}
            >
              {word.word} ({word.score})
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center p-4 text-[rgb(var(--font-color))]">
          No related words found
        </div>
      {/if}
    </div>

    <!-- ───────────── Wikipedia ───────────── -->
    <div class="sidebar-section">
      <h5 class="mt-0 text-base font-semibold">Wikipedia</h5>

      {#if wikipediaArticles.length > 0}
        <div class="space-y-2">
          {#each wikipediaArticles as article}
            <div
              class="cursor-pointer text-[rgb(var(--font-color))] p-2 rounded bg-[rgba(var(--background-color_modalbox),0.5)] hover:bg-[rgba(var(--background-color_modalbox),1)]"
              on:click={() => copyToClipboard(article.summary)}
              on:contextmenu={(e) => handleContextMenu(e, article.title)}
            >
              <h6 class="m-0 mb-1 text-sm font-semibold">{article.title}</h6>
              <p  class="m-0 text-xs">{article.summary}</p>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center p-4 text-[rgb(var(--font-color))]">
          No Wikipedia articles found
        </div>
      {/if}
    </div>

  </div>
</aside>
