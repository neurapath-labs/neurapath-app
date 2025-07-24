<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { database } from '$lib/stores/database.store';
  import { onMount, onDestroy } from 'svelte';
  import { processPDFFile } from '$lib/services/pdf.service';
  import type { Record } from '$lib/models';
  
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
        // Show error message for invalid file type
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
        // Show error message for invalid file type
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
  <div class="visible modalbox" id="modalbox-pdf-import">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/extract.svg" alt="PDF icon" />
      <span class="modalbox-title">Import PDF</span>
    </div>
    <div class="modalbox-content">
      <div class="file-upload-area" 
           on:dragover={handleDragOver} 
           on:drop={handleDrop}
           class:file-selected={selectedFile !== null}>
        {#if selectedFile}
          <p>Selected file: {selectedFile.name}</p>
          <button class="remove-file-button" on:click={() => selectedFile = null} type="button">Remove</button>
        {:else}
          <p>Drag and drop a PDF file here or click to select</p>
          <input type="file" accept=".pdf" on:change={handleFileSelect} />
        {/if}
      </div>
      
      <div class="folder-selection">
        <label for="folder-select">Select folder (optional):</label>
        <select id="folder-select" bind:value={folderPath}>
          <option value="">Root folder</option>
          {#each getFolderOptions() as folder}
            <option value={folder.id}>{folder.id}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="modalbox-buttons">
      <button class="modalbox-button secondary" on:click={closePdfImport} type="button" disabled={isProcessing}>Cancel</button>
      <button class="modalbox-button primary" on:click={processPdf} type="button" disabled={isProcessing || !selectedFile}>
        {isProcessing ? 'Processing...' : 'Import PDF'}
      </button>
    </div>
  </div>
{/if}

<style>
  .modalbox {
    position: absolute;
    overflow: hidden;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 400px;
    height: auto;
    min-height: 300px;
    left: 50%;
    top: 50%;
    margin-left: -200px;
    margin-top: -200px;
    grid-template-columns: auto;
    grid-template-rows: auto;
    align-content: center;
    display: grid;
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
  
  .modalbox-content {
    margin-bottom: 20px;
  }
  
  .file-upload-area {
    border: 2px dashed rgb(var(--background-color));
    border-radius: 4px;
    padding: 20px;
    text-align: center;
    margin-bottom: 20px;
    position: relative;
  }
  
  .file-upload-area.file-selected {
    border-color: rgb(var(--background-color_button));
  }
  
  .file-upload-area input[type="file"] {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: 0;
    cursor: pointer;
  }
  
  .remove-file-button {
    margin-top: 10px;
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .folder-selection {
    margin-top: 20px;
  }
  
  .folder-selection label {
    display: block;
    margin-bottom: 5px;
  }
  
  .folder-selection select {
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid rgb(var(--background-color));
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
  }
  
  .modalbox-buttons {
    display: flex;
    justify-content: space-between;
  }
  
  .modalbox-button {
    border-color: rgb(var(--background-color));
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    padding: 10px 15px;
    text-align: center;
    border-radius: 4px;
    align-self: center;
    border: none;
    cursor: pointer;
  }
  
  .modalbox-button.secondary {
    background-color: rgb(var(--background-color));
    color: rgb(var(--font-color));
  }
  
  .modalbox-button.primary {
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
  }
  
  .modalbox-button:hover {
    background-color: rgba(var(--background-color_button-hover));
  }
  
  .modalbox-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .visible {
    display: block !important;
  }
  
  .hidden {
    display: none !important;
  }
</style>