<script lang="ts">
  import { modal } from '$lib/stores/modal.store';
  import { selection } from '$lib/stores/selection.store';
  import { profile } from '$lib/stores/profile.store';
  import { onMount, onDestroy } from 'svelte';
  import { summarizeSelectedText } from '$lib/services/summarize.service';
  import type { SelectionState } from '$lib/stores/selection.store';

  let isOpen = false;
  let selectionData: SelectionState = { isSelected: false, text: '', range: null };
  let isProcessing = false;
  let apiKey = '';
  let provider: 'openai' | 'anthropic' = 'openai';
  let errorMessage = '';

  let unsubscribeModal: (() => void) | undefined;
  let unsubscribeSelection: (() => void) | undefined;
  let unsubscribeProfile: (() => void) | undefined;

  onMount(() => {
    unsubscribeModal = modal.subscribe(($modal) => {
      isOpen = $modal.isSummaryModalOpen;
      console.log('Summary modal state changed:', isOpen);
    });

    unsubscribeSelection = selection.subscribe(($selection) => {
      selectionData = $selection;
      console.log('Selection data updated:', $selection);
    });

    unsubscribeProfile = profile.subscribe(($profile) => {
      // Initialize API keys from profile
      console.log('Profile updated:', $profile);
      apiKey = $profile.openaiApiKey || $profile.anthropicApiKey || '';
      console.log('API key set:', apiKey);
      if ($profile.openaiApiKey) {
        provider = 'openai';
      } else if ($profile.anthropicApiKey) {
        provider = 'anthropic';
      }
      console.log('Provider set:', provider);
    });
  });

  onDestroy(() => {
    if (unsubscribeModal) unsubscribeModal();
    if (unsubscribeSelection) unsubscribeSelection();
    if (unsubscribeProfile) unsubscribeProfile();
  });

  async function handleSummarize() {
    if (!selectionData.isSelected || !selectionData.text) {
      errorMessage = 'Please select text to summarize';
      return;
    }

    if (!apiKey) {
      errorMessage = 'Please enter an API key';
      return;
    }

    isProcessing = true;
    errorMessage = '';

    try {
      const success = await summarizeSelectedText(apiKey, provider);
      if (success) {
        closeSummarizeModal();
      }
    } catch (error: any) {
      console.error('Error summarizing text:', error);
      errorMessage = error.message || 'Error summarizing text';
    } finally {
      isProcessing = false;
    }
  }

  function closeSummarizeModal() {
    modal.closeSummaryModal();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeSummarizeModal();
    }
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-summarize" on:keydown={handleKeydown}>
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/thinking.svg" alt="Summarize icon" />
      <span class="modalbox-title">Summarize Text</span>
    </div>
    
    <div class="summarize-content">
      {#if selectionData.isSelected}
        <div class="selected-text-preview">
          <h3>Selected Text:</h3>
          <div class="text-preview">
            {selectionData.text.length > 200 ? selectionData.text.substring(0, 200) + '...' : selectionData.text}
          </div>
        </div>
      {:else}
        <div class="no-selection">
          <p>No text selected. Please select text in the editor and try again.</p>
        </div>
      {/if}
      
      <div class="api-settings">
        <div class="form-group">
          <label for="api-key">API Key:</label>
          <input
            type="password"
            id="api-key"
            bind:value={apiKey}
            placeholder="Enter your OpenAI or Anthropic API key"
            class="api-key-input"
            disabled={isProcessing}
          />
        </div>
        
        <div class="form-group">
          <label for="provider">AI Provider:</label>
          <select
            id="provider"
            bind:value={provider}
            class="provider-select"
            disabled={isProcessing}
          >
            <option value="openai">OpenAI (GPT-3.5)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>
      </div>
      
      {#if errorMessage}
        <div class="error-message">
          {errorMessage}
        </div>
      {/if}
    </div>
    
    <div class="modal-actions">
      <button
        class="modalbox-button cancel-button"
        on:click={closeSummarizeModal}
        type="button"
        disabled={isProcessing}
      >
        Cancel
      </button>
      <button
        class="modalbox-button summarize-button"
        on:click={handleSummarize}
        type="button"
        disabled={isProcessing || !selectionData.isSelected || !apiKey}
      >
        {isProcessing ? 'Summarizing...' : 'Summarize'}
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
    width: 500px;
    height: auto;
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
  
  .summarize-content {
    margin-bottom: 20px;
  }
  
  .selected-text-preview {
    margin-bottom: 20px;
  }
  
  .selected-text-preview h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
  }
  
  .text-preview {
    padding: 10px;
    background-color: rgba(var(--background-color), 0.5);
    border-radius: 4px;
    max-height: 100px;
    overflow-y: auto;
    font-size: 14px;
  }
  
  .no-selection {
    padding: 20px;
    text-align: center;
    background-color: rgba(var(--background-color), 0.5);
    border-radius: 4px;
    margin-bottom: 20px;
  }
  
  .api-settings {
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .api-key-input, .provider-select {
    width: 100%;
    padding: 8px;
    border: 1px solid rgb(var(--background-color));
    border-radius: 4px;
    background-color: rgb(var(--background-color_input));
    color: rgb(var(--font-color));
    font-size: 14px;
  }
  
  .error-message {
    color: #f44336;
    font-size: 14px;
    margin-bottom: 15px;
    padding: 10px;
    background-color: rgba(244, 67, 54, 0.1);
    border-radius: 4px;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .modalbox-button {
    border-color: rgb(var(--background-color));
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    padding: 10px 15px;
    text-align: center;
    border-radius: 4px;
    align-self: center;
    cursor: pointer;
  }
  
  .modalbox-button:hover:not(:disabled) {
    background-color: rgba(var(--background-color_button-hover));
  }
  
  .modalbox-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .cancel-button {
    background-color: #f5f5f5;
    color: #333;
  }
  
  .summarize-button {
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
  }
  
  .summarize-button:hover:not(:disabled) {
    background-color: rgba(var(--background-color_button-hover));
  }
  
  .visible {
    display: block !important;
  }
  
  .hidden {
    display: none !important;
  }
</style>