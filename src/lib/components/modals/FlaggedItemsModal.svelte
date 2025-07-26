<script lang="ts">
  import { database } from '$lib/stores/database.store';
  import { ui } from '$lib/stores/ui.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';

  // Using Svelte 5 runes for reactivity
  let items: Record[] = $state([]);
  let isOpen: boolean = $state(false);

  // Subscribe to database and UI changes
  let unsubscribeDatabase: () => void;
  let unsubscribeUI: () => void;

  onMount(() => {
    // Subscribe to database changes
    unsubscribeDatabase = database.subscribe(($database) => {
      items = $database.items.filter(item => item.isFlagged === true);
    });

    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isFlaggedOpen;
    });
  });

  onDestroy(() => {
    if (unsubscribeDatabase) unsubscribeDatabase();
    if (unsubscribeUI) unsubscribeUI();
  });

  // Function to close the flagged items modal
  function closeFlagged() {
    ui.closeFlagged();
  }
</script>

{#if isOpen}
  <div id="modalbox-flagged" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[400px] h-[400px] max-h-[600px] grid grid-rows-[auto_1fr_auto] p-8 border border-[rgb(var(--background-color))] rounded overflow-scroll">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-5">
        <img class="w-[72px]" src="/img/flagged.svg" alt="Flagged items icon" />
        <span class="text-2xl font-semibold whitespace-nowrap">Flagged Items</span>
      </div>

      <!-- Flagged list -->
      <table id="flagged-list" class="w-full table-auto text-sm mb-5">
        <thead>
          <tr class="border-b border-[rgb(var(--background-color))]">
            <th class="text-left p-2">Name</th>
            <th class="text-left p-2">Repetitions</th>
            <th class="text-left p-2">E-factor</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item}
            <tr class="even:bg-[rgb(var(--background-color))] hover:bg-[rgb(var(--background-color))] hover:font-bold cursor-pointer border-b border-[rgb(var(--background-color))]">
              <td class="p-2">{item.id}</td>
              <td class="p-2">{item.totalRepetitionCount ?? 0}</td>
              <td class="p-2">{item.efactor?.toFixed(2) ?? '2.50'}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      <!-- Close button -->
      <button
        class="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))]"
        on:click={closeFlagged}
        type="button"
      >
        Close
      </button>
    </div>
  </div>
{/if}
