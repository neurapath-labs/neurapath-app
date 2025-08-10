<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import { database } from '$lib/stores/database.store';
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';
  import type { Record } from '$lib/models';
  import FlagIcon from '@lucide/svelte/icons/flag';

  // Svelte‑5 runes
  let items: Record[] = $state([]);
  let isOpen: boolean = $state(false);

  // Subscriptions
  let unsubscribeDB: () => void;
  let unsubscribeUI: () => void;

  onMount(() => {
    unsubscribeDB = database.subscribe(($db) => {
      items = $db.items.filter((i) => i.isFlagged === true);
    });
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isFlaggedOpen;
    });
  });

  onDestroy(() => {
    unsubscribeDB?.();
    unsubscribeUI?.();
  });

  // Close helper
  function closeFlagged() {
    ui.closeFlagged();
  }

  // Click handler for items
  function handleItemClick(itemId: string) {
    ui.setActiveItemId(itemId);
    ui.expandAllParentsToId(itemId);
  }
</script>

<!-- FLAGGED DIALOG -->
<Dialog.Root bind:open={isOpen}>
  <Dialog.Portal>
    <!-- Overlay (no fade) -->
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-50" />

    <!-- Centered card -->
    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] max-h-[90vh]
             grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border
             border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))]
             text-[rgb(var(--font-color))] p-6 shadow-lg focus:outline-none z-50"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <FlagIcon class="w-9 h-9" />
        <h1 class="text-xl font-semibold">Flagged Items</h1>
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-y-auto rounded border border-[rgb(var(--background-color))]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-[rgb(var(--background-color_modalbox))]">
            <tr class="border-b border-[rgb(var(--background-color))]">
              <th class="p-3 text-left font-semibold">Name</th>
              <th class="p-3 text-left font-semibold">Repetitions</th>
              <th class="p-3 text-left font-semibold">E‑factor</th>
            </tr>
          </thead>
          <tbody>
            {#each items as item}
              <tr
                class="border-b border-[rgb(var(--background-color))] even:bg-[rgba(var(--background-color),0.1)]
                       hover:bg-[rgba(var(--background-color),0.2)] cursor-pointer"
                onclick={() => handleItemClick(item.id)}
              >
                <td class="p-3">{item.id}</td>
                <td class="p-3">{item.totalRepetitionCount ?? 0}</td>
                <td class="p-3">{item.efactor?.toFixed(2) ?? '2.50'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
