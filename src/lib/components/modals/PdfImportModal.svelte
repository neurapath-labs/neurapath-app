<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import { ui } from '$lib/stores/ui.store';
  import { database } from '$lib/stores/database.store';
  import { onMount, onDestroy } from 'svelte';
  import { processPDFFile } from '$lib/services/pdf.service';
  import type { Record } from '$lib/models';
  import ScissorsIcon from '@lucide/svelte/icons/scissors';

  // Svelte 5 runes
  let isOpen: boolean = $state(false);
  let isProcessing: boolean = $state(false);
  let selectedFile: File | null = $state(null);
  let folderPath: string = $state('');
  let databaseItems: Record[] = $state([]);

  // Subscriptions
  let unsubscribeDatabase: () => void;
  let unsubscribeUI: () => void;

  onMount(() => {
    unsubscribeDatabase = database.subscribe(($database) => {
      databaseItems = $database.items;
    });
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isPdfImportOpen;
    });
  });

  onDestroy(() => {
    unsubscribeDatabase?.();
    unsubscribeUI?.();
  });

  function closePdfImport() {
    ui.closePdfImport();
    selectedFile = null;
    folderPath = '';
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') {
      selectedFile = file;
    } else {
      alert('Please select a PDF file.');
      input.value = '';
    }
  }

  const handleDragOver = (event: DragEvent) => event.preventDefault();

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') selectedFile = file;
    else alert('Please drop a PDF file.');
  }

  async function processPdf() {
    if (!selectedFile) {
      alert('Please select a PDF file first.');
      return;
    }
    try {
      isProcessing = true;
      await processPDFFile(selectedFile, folderPath);
      closePdfImport();
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Error processing PDF file.');
    } finally {
      isProcessing = false;
    }
  }

  function getFolderOptions(): Record[] {
    return databaseItems.filter((item) => item.contentType === 'Folder');
  }
</script>

<!-- PDF IMPORT DIALOG -->
<Dialog.Root bind:open={isOpen}>
  <Dialog.Portal>
    <!-- Transparent overlay for parity with other modals -->
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-50" />

    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] max-h-[90vh]
             grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border
             border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))]
             text-[rgb(var(--font-color))] p-6 shadow-lg focus:outline-none z-50"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <ScissorsIcon class="w-9 h-9" />
        <h1 class="text-xl font-semibold">Import PDF</h1>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- File upload area -->
        <div
          ondragover={handleDragOver}
          ondrop={handleDrop}
          role="region"
          aria-label="PDF file drop zone"
          class="relative mb-4 rounded border-2 border-dashed p-5 text-center transition-colors duration-200"
          class:border-[rgb(var(--background-color_button))]={selectedFile}
          style="border-color: rgb(var(--background-color));"
        >
          {#if selectedFile}
            <p class="text-sm">Selected file: {selectedFile.name}</p>
            <Button
              size="sm"
              onclick={() => (selectedFile = null)}
              class="mt-2 rounded bg-[rgb(var(--background-color_button))] px-3 py-1 text-xs text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))]"
            >
              Remove
            </Button>
          {:else}
            <p class="text-sm">Drag and drop a PDF file here or click to select</p>
            <input
              type="file"
              accept=".pdf"
              onchange={handleFileSelect}
              class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          {/if}
        </div>

        <!-- Folder selection -->
        <div class="mt-5">
          <label for="folder-select" class="mb-2 block text-sm font-medium">Select folder (optional):</label>
          <select
            id="folder-select"
            bind:value={folderPath}
            class="w-full rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))] px-3 py-2 text-sm text-[rgb(var(--font-color))]"
          >
            <option value="">Root folder</option>
            {#each getFolderOptions() as folder}
              <option value={folder.id}>{folder.id}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-4 flex justify-between">
        <Button
          type="button"
          onclick={closePdfImport}
          disabled={isProcessing}
          variant="outline"
          size="sm"
          class="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onclick={processPdf}
          disabled={isProcessing || !selectedFile}
          variant="outline"
          size="sm"
          class="cursor-pointer"
        >
          {isProcessing ? 'Processing…' : 'Import PDF'}
        </Button>
      </div>

    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>