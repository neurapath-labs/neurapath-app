<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';
  import { Button } from "$lib/components/ui/button";
  import { getPublicDatabases } from '$lib/services/database.service';
  import type { Database } from '$lib/models';
  import DatabaseIcon from '@lucide/svelte/icons/database';

  // Using Svelte 5 runes for reactivity
  let databases: Database[] = $state([]);
  let isOpen: boolean = $state(false);
  let isLoading: boolean = $state(false);
  let hasLoaded: boolean = $state(false);

  // Subscribe to UI changes
  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    unsubscribeUI = ui.subscribe(($ui) => {
      ('[DatabasesModal] UI store updated, isDatabasesOpen:', $ui.isDatabasesOpen);
      const wasOpen = isOpen;
      isOpen = $ui.isDatabasesOpen;
      
      // Only load databases when modal is first opened, not on every UI update
      if (isOpen && !wasOpen && !hasLoaded) {
        loadDatabases();
        hasLoaded = true;
      }
      
      // Reset hasLoaded when modal is closed
      if (!isOpen && wasOpen) {
        hasLoaded = false;
      }
    });
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  // Load public databases
  const loadDatabases = async () => {
    isLoading = true;
    try {
      databases = await getPublicDatabases();
    } catch (error) {
      console.error('Error loading databases:', error);
    } finally {
      isLoading = false;
    }
  };

  // Close & navigate helpers
  function closeDatabases() {
    ('[DatabasesModal] closeDatabases called');
    ui.closeDatabases();
  }
  function openExportImport() {
    ('[DatabasesModal] openExportImport called');
    ('[DatabasesModal] Current isOpen value:', isOpen);
    ('[DatabasesModal] Current databases length:', databases.length);
    ui.closeDatabases();
    ('[DatabasesModal] databases closed, opening export/import');
    ui.openExportImport();
    ('[DatabasesModal] export/import opened');
  }
  
  // Add a test function to verify button clicks are being registered
  function testClick() {
    ('[DatabasesModal] Button was clicked!');
  }
  
  // Handle dialog open change
  function handleOpenChange(open: boolean) {
    ('[DatabasesModal] Dialog open state changed to:', open);
    if (!open) {
      ('[DatabasesModal] Dialog closed, updating UI store');
      ui.closeDatabases();
    }
  }
</script>

<!-- DATABASES DIALOG -->
<Dialog.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <!-- Overlay without dim -->
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-50" />

    <!-- Centered card -->
    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] max-h-[90vh] grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] p-6 shadow-lg focus:outline-none z-50"
      interactOutsideBehavior="close"
      escapeKeydownBehavior="close"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <DatabaseIcon class="w-9 h-9" />
        <h1 class="text-xl font-semibold">Shared Databases</h1>
      </div>

      <!-- Body -->
      <div class="flex flex-col space-y-6 overflow-hidden">
        <!-- Actions -->
        <div>
          <Button class="w-full mt-2" onclick={openExportImport} on:pointerdown={() => ('[DatabasesModal] Button pointerdown event')}>Export / Import Database</Button>
        </div>

        <!-- Database list -->
        <div class="flex-1 overflow-y-auto rounded border border-[rgb(var(--background-color))]">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-[rgb(var(--background-color_modalbox))]">
              <tr class="border-b border-[rgb(var(--background-color))]">
                <th class="p-3 text-left font-semibold">Database</th>
              </tr>
            </thead>
            <tbody>
              {#if isLoading}
                <tr><td class="p-3">Loading...</td></tr>
              {:else}
                {#each databases as database}
                  <tr class="border-b border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color),0.2)] cursor-pointer">
                    <td class="p-3">{database.name || database.id}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>

    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
