<script lang="ts">
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

  // Subscribe to UI changes
  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isDatabasesOpen;
      if (isOpen && databases.length === 0) {
        loadDatabases();
      }
    });
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  // Function to load public databases
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

  // Function to close the databases modal
  function closeDatabases() {
    ui.closeDatabases();
  }
  
  // Function to open export/import modal
  function openExportImport() {
    ui.closeDatabases();
    ui.openExportImport();
  }
</script>

{#if isOpen}
  <div id="modalbox-databases" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[400px] h-[400px] max-h-[600px] grid grid-rows-[auto_1fr_auto] p-8 border border-[rgb(var(--background-color))] rounded overflow-scroll">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-5">
        <DatabaseIcon class="w-[72px] h-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Shared Databases</span>
      </div>

      <!-- Actions -->
      <div class="mb-5">
        <Button
          class="px-4 py-2 rounded bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))]"
          on:click={openExportImport}
          type="button"
        >
          Export/Import Database
        </Button>
      </div>

      <!-- Database list -->
      <table id="database-list" class="w-full table-auto text-sm mb-5">
        <thead>
          <tr class="border-b border-[rgb(var(--background-color))]">
            <th class="text-left p-2">Database</th>
          </tr>
        </thead>
        <tbody>
          {#if isLoading}
            <tr>
              <td class="p-2">Loading...</td>
            </tr>
          {:else}
            {#each databases as database}
              <tr class="border-b border-[rgb(var(--background-color))] hover:bg-[rgb(var(--background-color))] cursor-pointer">
                <td class="p-2">{database.name || database.id}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>

      <!-- Close button -->
      <Button
        class="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))]"
        on:click={closeDatabases}
        type="button"
      >
        Close
      </Button>
    </div>
  </div>
{/if}
