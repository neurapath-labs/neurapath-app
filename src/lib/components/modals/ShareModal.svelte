<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { modal } from '$lib/stores/modal.store';
  import { database } from '$lib/stores/database.store';
  import {
    generateShareableLink,
    toggleItemPublicStatus,
    getItemPublicStatus,
    makeDatabasePublic,
    makeDatabasePrivate,
    getDatabasePublicStatus
  } from '$lib/services/share.service';
  import { onMount, onDestroy } from 'svelte';
  import type { Record } from '$lib/models';

  // Using Svelte 5 runes for reactivity
  let isOpen = $state(false);
  let targetItem = $state<Record | null>(null);
  let isItemPublic = $state(false);
  let shareableLink = $state('');
  let isDatabasePublic = $state(false);
  let isProcessing = $state(false);

  // Subscribe to UI changes
  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isShareModalOpen;
      if (isOpen && $ui.shareModalTargetId) {
        loadItemData($ui.shareModalTargetId);
      }
    });
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  // Function to load item data
  async function loadItemData(itemId: string) {
    try {
      targetItem = database.getRecordById(itemId) || null;
      if (targetItem) {
        isItemPublic = getItemPublicStatus(itemId);
        shareableLink = generateShareableLink(itemId);
      }
      isDatabasePublic = getDatabasePublicStatus();
    } catch (error) {
      console.error('Error loading item data:', error);
      modal.showAlert('Error loading item data', 'danger');
    }
  }

  // Function to toggle item public status
  async function togglePublicStatus() {
    if (!targetItem) return;
    
    isProcessing = true;
    try {
      const newStatus = await toggleItemPublicStatus(targetItem.id);
      isItemPublic = newStatus;
      
      if (newStatus) {
        modal.showAlert('Item is now public', 'success');
      } else {
        modal.showAlert('Item is now private', 'success');
      }
    } catch (error) {
      console.error('Error toggling public status:', error);
      modal.showAlert('Error toggling public status', 'danger');
    } finally {
      isProcessing = false;
    }
  }

  // Function to toggle database public status
  async function toggleDatabasePublicStatus() {
    isProcessing = true;
    try {
      if (isDatabasePublic) {
        await makeDatabasePrivate();
        isDatabasePublic = false;
        modal.showAlert('Database is now private', 'success');
      } else {
        await makeDatabasePublic();
        isDatabasePublic = true;
        modal.showAlert('Database is now public', 'success');
      }
    } catch (error) {
      console.error('Error toggling database public status:', error);
      modal.showAlert('Error toggling database public status', 'danger');
    } finally {
      isProcessing = false;
    }
  }

  // Function to copy shareable link to clipboard
  async function copyLinkToClipboard() {
    if (!shareableLink) return;
    
    try {
      await navigator.clipboard.writeText(shareableLink);
      modal.showAlert('Link copied to clipboard', 'success');
    } catch (error) {
      console.error('Error copying link to clipboard:', error);
      modal.showAlert('Error copying link to clipboard', 'danger');
    }
  }

  // Function to close the share modal
  function closeShareModal() {
    ui.closeShareModal();
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-share">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/network.svg" alt="Share icon" />
      <span class="modalbox-title">Share Item</span>
    </div>
    
    {#if targetItem}
      <div class="share-item-info">
        <h3>{targetItem.id}</h3>
        <p>Type: {targetItem.contentType}</p>
      </div>
      
      <div class="share-controls">
        <div class="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={isItemPublic} 
              on:change={togglePublicStatus}
              disabled={isProcessing}
            />
            Make this item public
          </label>
          <p class="help-text">
            {isItemPublic ? 'This item is currently public and can be accessed by anyone with the link.' : 'This item is currently private and can only be accessed by you.'}
          </p>
        </div>
        
        {#if isItemPublic}
          <div class="control-group">
            <label for="share-link">Shareable Link:</label>
            <div class="link-container">
              <input 
                type="text" 
                id="share-link"
                value={shareableLink} 
                readonly 
                class="share-link-input"
              />
              <button 
                class="copy-button" 
                on:click={copyLinkToClipboard}
                disabled={isProcessing}
                type="button"
              >
                Copy
              </button>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <p>Loading item data...</p>
    {/if}
    
    <div class="database-share-controls">
      <h3>Database Sharing</h3>
      <div class="control-group">
        <label>
          <input 
            type="checkbox" 
            checked={isDatabasePublic} 
            on:change={toggleDatabasePublicStatus}
            disabled={isProcessing}
          />
          Make entire database public
        </label>
        <p class="help-text">
          {isDatabasePublic ? 'Your entire database is currently public.' : 'Your entire database is currently private.'}
        </p>
      </div>
    </div>
    
    <div class="modal-actions">
      <button 
        class="modalbox-button" 
        on:click={closeShareModal} 
        type="button"
        disabled={isProcessing}
      >
        Close
      </button>
    </div>
  </div>
{/if}

<style>
  .modalbox {
    position: absolute;
    overflow: scroll;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 400px;
    height: auto;
    max-height: 600px;
    left: 50%;
    top: 50%;
    margin-left: -200px;
    margin-top: -300px;
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

  .share-item-info {
    margin-bottom: 20px;
    padding: 10px;
    background-color: rgba(var(--background-color), 0.5);
    border-radius: 4px;
  }

  .share-item-info h3 {
    margin: 0 0 10px 0;
    font-size: 18px;
  }

  .share-item-info p {
    margin: 0;
    font-size: 14px;
    color: rgb(var(--font-color-secondary));
  }

  .share-controls, .database-share-controls {
    margin-bottom: 20px;
  }

  .database-share-controls h3 {
    margin-top: 0;
    margin-bottom: 15px;
  }

  .control-group {
    margin-bottom: 15px;
  }

  .control-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .control-group input[type="checkbox"] {
    margin-right: 8px;
  }

  .help-text {
    font-size: 12px;
    color: rgb(var(--font-color-secondary));
    margin: 5px 0 0 0;
  }

  .link-container {
    display: flex;
    gap: 10px;
  }

  .share-link-input {
    flex: 1;
    padding: 8px;
    border: 1px solid rgb(var(--background-color));
    border-radius: 4px;
    background-color: rgb(var(--background-color_input));
    color: rgb(var(--font-color));
  }

  .copy-button {
    border-color: rgb(var(--background-color));
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    padding: 8px 12px;
    text-align: center;
    border-radius: 4px;
    cursor: pointer;
  }

  .copy-button:hover:not(:disabled) {
    background-color: rgba(var(--background-color_button-hover));
  }

  .copy-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modal-actions {
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
    margin-bottom: 10px;
    cursor: pointer;
  }

  .modalbox-button:hover:not(:disabled) {
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