<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { database } from '$lib/stores/database.store';
  import { onMount, onDestroy } from 'svelte';
  import { processPDFFile } from '$lib/services/pdf.service';
  import type { Record } from '$lib/models';
  import ScissorsIcon from '@lucide/svelte/icons/scissors';
  
  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);
  let isProcessing: boolean = $state(false);
  let selectedFile: File | null = $state(null);
  let folderPath: string = $state('');
  let databaseItems: Record[] = $state([]);
  
  // Subscribe to database and UI changes
  let unsubscribeDatabase: () => void;
  let unsubscribeUI: () => void;
  
  onMount(() => {
    // Subscribe to database changes
    unsubscribeDatabase = database.subscribe(($database) => {
      databaseItems = $database.items;
    });
    
    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isPdfImportOpen;
    });
  });
  
  onDestroy(() => {
    if (unsubscribeDatabase) unsubscribeDatabase();
    if (unsubscribeUI) unsubscribeUI();
  });
  
  // Function to close the PDF import modal
  function closePdfImport() {
    ui.closePdfImport();
    selectedFile = null;
    folderPath = '';
  }
  
  // Function to handle file selection
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        selectedFile = file;
      } else {
        alert('Please select a PDF file.');
        input.value = '';
      }
    }
  }
  
  // Function to handle drag and drop
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        selectedFile = file;
      } else {
        alert('Please drop a PDF file.');
      }
    }
  }
  
  // Function to process the selected PDF file
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
  
  // Function to get folder options for dropdown
  function getFolderOptions(): Record[] {
    return databaseItems.filter(item => item.contentType === 'Folder');
  }
</script>

{#if isOpen}
  <div id="modalbox-pdf-import" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[400px] min-h-[300px] max-h-[600px] p-8 border border-[rgb(var(--background-color))] rounded overflow-hidden">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-5">
        <ScissorsIcon class="w-[72px] h-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Import PDF</span>
      </div>

      <!-- Content -->
      <div class="mb-5">
        <!-- File upload area -->
        <div
          on:dragover={handleDragOver}
          on:drop={handleDrop}
          class="relative border-2 border-dashed rounded p-5 text-center mb-5 transition-colors duration-200"
          class:border-[rgb(var(--background-color_button))]={selectedFile !== null}
          style="border-color: rgb(var(--background-color));"
        >
          {#if selectedFile}
            <p class="text-sm">Selected file: {selectedFile.name}</p>
            <button
              type="button"
              class="mt-2 px-3 py-1 rounded bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] text-sm"
              on:click={() => (selectedFile = null)}
            >
              Remove
            </button>
          {:else}
            <p class="text-sm">Drag and drop a PDF file here or click to select</p>
            <input
              type="file"
              accept=".pdf"
              on:change={handleFileSelect}
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          {/if}
        </div>

        <!-- Folder selection -->
        <div class="mt-5">
          <label for="folder-select" class="block mb-2 text-sm font-medium">Select folder (optional):</label>
          <select
            id="folder-select"
            bind:value={folderPath}
            class="w-full px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] text-sm"
          >
            <option value="">Root folder</option>
            {#each getFolderOptions() as folder}
              <option value={folder.id}>{folder.id}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex justify-between">
        <button
          type="button"
          on:click={closePdfImport}
          disabled={isProcessing}
          class="px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color))] text-[rgb(var(--font-color))] hover:bg-[rgba(var(--background-color_button-hover))] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          on:click={processPdf}
          disabled={isProcessing || !selectedFile}
          class="px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isProcessing ? 'Processing...' : 'Import PDF'}
        </button>
      </div>
    </div>
  </div>
{/if}