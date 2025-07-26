<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { ui } from '$lib/stores/ui.store';
  import { database } from '$lib/stores/database.store';
  import { onMount, onDestroy } from 'svelte';
  import {
    exportDatabaseToJSON,
    exportDatabaseToCSV,
    importDatabaseFromJSON,
    importDatabaseFromCSV
  } from '$lib/services/export.service';
  import type { Record } from '$lib/models';
  import DatabaseIcon from '@lucide/svelte/icons/database';

  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);
  let isExporting: boolean = $state(false);
  let isImporting: boolean = $state(false);
  let selectedFile: File | null = $state(null);
  let importFormat: string = $state('json');
  let databaseItems: Record[] = $state([]);

  // Reactive counts
  let counts = $derived({
    folders: databaseItems.filter(item => item.contentType === 'Folder').length,
    extracts: databaseItems.filter(item => item.contentType === 'Extract').length,
    clozes: databaseItems.filter(item => item.contentType === 'Cloze').length,
    images: databaseItems.filter(item => item.contentType === 'Image').length,
    occlusions: databaseItems.filter(item => item.contentType === 'Occlusion').length
  });

  let unsubscribeDatabase: () => void;
  let unsubscribeUI: () => void;

  onMount(() => {
    unsubscribeDatabase = database.subscribe(($database) => {
      databaseItems = $database.items;
    });

    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isExportImportOpen;
    });
  });

  onDestroy(() => {
    if (unsubscribeDatabase) unsubscribeDatabase();
    if (unsubscribeUI) unsubscribeUI();
  });

  function closeExportImport() {
    ui.closeExportImport();
    selectedFile = null;
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if ((importFormat === 'json' && fileType === 'json') || (importFormat === 'csv' && fileType === 'csv')) {
        selectedFile = file;
      } else {
        alert(`Please select a ${importFormat.toUpperCase()} file.`);
        input.value = '';
      }
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if ((importFormat === 'json' && fileType === 'json') || (importFormat === 'csv' && fileType === 'csv')) {
        selectedFile = file;
      } else {
        alert(`Please drop a ${importFormat.toUpperCase()} file.`);
      }
    }
  }

  async function exportToJson() {
    try {
      isExporting = true;
      await exportDatabaseToJSON();
    } catch (error) {
      console.error(error);
      alert('Error exporting database to JSON.');
    } finally {
      isExporting = false;
    }
  }

  async function exportToCsv() {
    try {
      isExporting = true;
      await exportDatabaseToCSV();
    } catch (error) {
      console.error(error);
      alert('Error exporting database to CSV.');
    } finally {
      isExporting = false;
    }
  }

  async function importDatabase() {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }
    try {
      isImporting = true;
      const success = importFormat === 'json'
        ? await importDatabaseFromJSON(selectedFile)
        : await importDatabaseFromCSV(selectedFile);
      if (success) closeExportImport();
    } catch (error) {
      console.error(error);
      alert('Error importing database.');
    } finally {
      isImporting = false;
    }
  }
</script>

{#if isOpen}
  <div id="modalbox-export-import" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[500px] min-h-[400px] max-h-[600px] p-8 border border-[rgb(var(--background-color))] rounded overflow-y-auto">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-6">
        <DatabaseIcon class="w-[72px] h-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Export/Import Database</span>
      </div>

      <!-- Content -->
      <div class="space-y-10">
        <!-- Export section -->
        <div>
          <h3 class="text-lg font-semibold mb-1">Export Database</h3>
          <p class="text-sm mb-4">Export your entire database to a file for backup or transfer.</p>
          {#if databaseItems.length > 0}
            <div class="bg-[rgba(var(--background-color),0.5)] rounded p-4 mb-4 text-sm">
              <p class="m-0 mb-2">Current database contains:</p>
              <ul class="list-disc list-inside space-y-1">
                <li>Folders: {counts.folders}</li>
                <li>Extracts: {counts.extracts}</li>
                <li>Clozes: {counts.clozes}</li>
                <li>Images: {counts.images}</li>
                <li>Occlusions: {counts.occlusions}</li>
              </ul>
            </div>
          {:else}
            <p class="text-sm italic mb-4">Your database is currently empty.</p>
          {/if}
          <div class="flex gap-3">
            <Button
              type="button"
              on:click={exportToJson}
              disabled={isExporting || databaseItems.length === 0}
              variant="outline"
              size="sm"
              class="flex-1"
            >
              {isExporting ? 'Exporting...' : 'Export to JSON'}
            </Button>
            <Button
              type="button"
              on:click={exportToCsv}
              disabled={isExporting || databaseItems.length === 0}
              variant="outline"
              size="sm"
              class="flex-1"
            >
              {isExporting ? 'Exporting...' : 'Export to CSV'}
            </Button>
          </div>
        </div>

        <!-- Import section -->
        <div>
          <h3 class="text-lg font-semibold mb-1">Import Database</h3>
          <p class="text-sm mb-4">Import data from a previously exported file.</p>

          <!-- Format selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Import format:</label>
            <div class="flex gap-4 items-center text-sm">
              <label><input type="radio" name="import-format" value="json" class="mr-1" checked={importFormat === 'json'} on:change={() => (importFormat = 'json')} /> JSON</label>
              <label><input type="radio" name="import-format" value="csv" class="mr-1" checked={importFormat === 'csv'} on:change={() => (importFormat = 'csv')} /> CSV</label>
            </div>
          </div>

          <!-- File drop -->
          <div
            on:dragover={handleDragOver}
            on:drop={handleDrop}
            class="relative border-2 border-dashed rounded p-5 text-center mb-4 transition-colors duration-200"
            class:border-[rgb(var(--background-color_button))]={selectedFile !== null}
            style="border-color: rgb(var(--background-color));"
          >
            {#if selectedFile}
              <p class="text-sm">Selected file: {selectedFile.name}</p>
              <Button
                type="button"
                class="mt-2 px-3 py-1 rounded bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] text-xs"
                on:click={() => (selectedFile = null)}
                size="sm"
              >
                Remove
              </Button>
            {:else}
              <p class="text-sm">Drag and drop a {importFormat.toUpperCase()} file here or click to select</p>
              <input
                type="file"
                accept={importFormat === 'json' ? '.json' : '.csv'}
                on:change={handleFileSelect}
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            {/if}
          </div>

          <Button
            type="button"
            on:click={importDatabase}
            disabled={isImporting || !selectedFile}
            variant="outline"
            class="w-full"
          >
            {isImporting ? 'Importing...' : 'Import Database'}
          </Button>
        </div>
      </div>

    </div>
  </div>
{/if}
