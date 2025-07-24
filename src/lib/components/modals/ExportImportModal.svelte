<script lang="ts">
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
  
  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);
  let isExporting: boolean = $state(false);
  let isImporting: boolean = $state(false);
  let selectedFile: File | null = $state(null);
  let importFormat: string = $state('json');
  let databaseItems: Record[] = $state([]);
  
  // Reactive statement to calculate item counts
  let counts = $derived({
    folders: databaseItems.filter(item => item.contentType === 'Folder').length,
    extracts: databaseItems.filter(item => item.contentType === 'Extract').length,
    clozes: databaseItems.filter(item => item.contentType === 'Cloze').length,
    images: databaseItems.filter(item => item.contentType === 'Image').length,
    occlusions: databaseItems.filter(item => item.contentType === 'Occlusion').length
  });
  
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
      isOpen = $ui.isExportImportOpen;
    });
  });
  
  onDestroy(() => {
    if (unsubscribeDatabase) unsubscribeDatabase();
    if (unsubscribeUI) unsubscribeUI();
  });
  
  // Function to close the export/import modal
  function closeExportImport() {
    ui.closeExportImport();
    selectedFile = null;
  }
  
  // Function to handle file selection
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      if ((importFormat === 'json' && fileType === 'json') || 
          (importFormat === 'csv' && fileType === 'csv')) {
        selectedFile = file;
      } else {
        // Show error message for invalid file type
        alert(`Please select a ${importFormat.toUpperCase()} file.`);
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
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      if ((importFormat === 'json' && fileType === 'json') || 
          (importFormat === 'csv' && fileType === 'csv')) {
        selectedFile = file;
      } else {
        // Show error message for invalid file type
        alert(`Please drop a ${importFormat.toUpperCase()} file.`);
      }
    }
  }
  
  // Function to export database to JSON
  async function exportToJson() {
    try {
      isExporting = true;
      await exportDatabaseToJSON();
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      alert('Error exporting database to JSON.');
    } finally {
      isExporting = false;
    }
  }
  
  // Function to export database to CSV
  async function exportToCsv() {
    try {
      isExporting = true;
      await exportDatabaseToCSV();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error exporting database to CSV.');
    } finally {
      isExporting = false;
    }
  }
  
  // Function to import database from selected file
  async function importDatabase() {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }
    
    try {
      isImporting = true;
      let success = false;
      
      if (importFormat === 'json') {
        success = await importDatabaseFromJSON(selectedFile);
      } else if (importFormat === 'csv') {
        success = await importDatabaseFromCSV(selectedFile);
      }
      
      if (success) {
        closeExportImport();
      }
    } catch (error) {
      console.error('Error importing database:', error);
      alert('Error importing database.');
    } finally {
      isImporting = false;
    }
  }
  
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-export-import">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/database.svg" alt="Database icon" />
      <span class="modalbox-title">Export/Import Database</span>
    </div>
    <div class="modalbox-content">
      <div class="export-section">
        <h3>Export Database</h3>
        <p>Export your entire database to a file for backup or transfer.</p>
        
        <div class="item-counts">
          {#if databaseItems.length > 0}
            <p>Current database contains:</p>
            <ul>
              <li>Folders: {counts.folders}</li>
              <li>Extracts: {counts.extracts}</li>
              <li>Clozes: {counts.clozes}</li>
              <li>Images: {counts.images}</li>
              <li>Occlusions: {counts.occlusions}</li>
            </ul>
          {:else}
            <p>Your database is currently empty.</p>
          {/if}
        </div>
        
        <div class="export-buttons">
          <button 
            class="export-button" 
            on:click={exportToJson} 
            disabled={isExporting || databaseItems.length === 0}
            type="button"
          >
            {isExporting ? 'Exporting...' : 'Export to JSON'}
          </button>
          <button 
            class="export-button" 
            on:click={exportToCsv} 
            disabled={isExporting || databaseItems.length === 0}
            type="button"
          >
            {isExporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>
      
      <div class="import-section">
        <h3>Import Database</h3>
        <p>Import data from a previously exported file.</p>
        
        <div class="import-format">
          <label>Import format:</label>
          <div class="format-options">
            <label>
              <input 
                type="radio" 
                name="import-format" 
                value="json" 
                checked={importFormat === 'json'}
                on:change={() => importFormat = 'json'}
              />
              JSON
            </label>
            <label>
              <input 
                type="radio" 
                name="import-format" 
                value="csv" 
                checked={importFormat === 'csv'}
                on:change={() => importFormat = 'csv'}
              />
              CSV
            </label>
          </div>
        </div>
        
        <div class="file-upload-area" 
             on:dragover={handleDragOver} 
             on:drop={handleDrop}
             class:file-selected={selectedFile !== null}>
          {#if selectedFile}
            <p>Selected file: {selectedFile.name}</p>
            <button class="remove-file-button" on:click={() => selectedFile = null} type="button">Remove</button>
          {:else}
            <p>Drag and drop a {importFormat.toUpperCase()} file here or click to select</p>
            <input 
              type="file" 
              accept={importFormat === 'json' ? '.json' : '.csv'} 
              on:change={handleFileSelect} 
            />
          {/if}
        </div>
        
        <button 
          class="import-button" 
          on:click={importDatabase} 
          disabled={isImporting || !selectedFile}
          type="button"
        >
          {isImporting ? 'Importing...' : 'Import Database'}
        </button>
      </div>
    </div>
    <div class="modalbox-buttons">
      <button class="modalbox-button" on:click={closeExportImport} type="button">Close</button>
    </div>
  </div>
{/if}

<style>
  .modalbox {
    position: absolute;
    overflow: hidden;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 500px;
    height: auto;
    min-height: 400px;
    left: 50%;
    top: 50%;
    margin-left: -250px;
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
  
  .export-section, .import-section {
    margin-bottom: 30px;
  }
  
  .export-section h3, .import-section h3 {
    margin-top: 0;
    margin-bottom: 10px;
  }
  
  .item-counts {
    background-color: rgba(var(--background-color), 0.5);
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
  }
  
  .item-counts ul {
    margin: 10px 0;
    padding-left: 20px;
  }
  
  .export-buttons {
    display: flex;
    gap: 10px;
  }
  
  .export-button {
    flex: 1;
    padding: 10px;
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .export-button:hover:not(:disabled) {
    background-color: rgba(var(--background-color_button-hover));
  }
  
  .export-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .import-format {
    margin-bottom: 15px;
  }
  
  .format-options {
    display: flex;
    gap: 15px;
    margin-top: 5px;
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
  
  .import-button {
    width: 100%;
    padding: 12px;
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
  
  .import-button:hover:not(:disabled) {
    background-color: rgba(var(--background-color_button-hover));
  }
  
  .import-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .modalbox-buttons {
    display: flex;
    justify-content: flex-end;
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
  
  .modalbox-button:hover {
    background-color: rgba(var(--background-color_button-hover));
  }
  
  .visible {
    display: block !important;
  }
  
  .hidden {
    display: none !important;
  }
</style>