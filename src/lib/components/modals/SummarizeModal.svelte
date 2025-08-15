<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { modal } from '$lib/stores/modal.store';
  import { selection } from '$lib/stores/selection.store';
  import { profile } from '$lib/stores/profile.store';
  import { onMount, onDestroy } from 'svelte';
  import { summarizeSelectedText } from '$lib/services/summarize.service';
  import type { SelectionState } from '$lib/stores/selection.store';
  import BrainIcon from '@lucide/svelte/icons/brain';

  let isOpen = $state(true);
  let selectionData: SelectionState = $state({ isSelected: false, text: '', range: null });
  let isProcessing = $state(false);
  let apiKey = $state('');
  let provider: 'openRouter' = $state('openRouter');
  let errorMessage = $state('');

  let unsubscribeModal: (() => void) | undefined;
  let unsubscribeSelection: (() => void) | undefined;
  let unsubscribeProfile: (() => void) | undefined;

  onMount(() => {
    unsubscribeModal = modal.subscribe(($modal) => {
      isOpen = $modal.isSummaryModalOpen;
    });

    unsubscribeSelection = selection.subscribe(($selection) => {
      selectionData = $selection;
    });

    unsubscribeProfile = profile.subscribe(($profile) => {
      apiKey = $profile.openRouterApiKey || '';
      provider = 'openRouter'
    });
  });

  onDestroy(() => {
    unsubscribeModal?.();
    unsubscribeSelection?.();
    unsubscribeProfile?.();
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
      if (success) closeSummarizeModal();
    } catch (e: any) {
      errorMessage = e?.message || 'Error summarizing text';
    } finally {
      isProcessing = false;
    }
  }

  function closeSummarizeModal() {
    modal.closeSummaryModal();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeSummarizeModal();
  }
</script>

{#if isOpen}
<div id="modalbox-summarize" class="fixed inset-0 flex items-center justify-center z-10" role="dialog" tabindex="-1" onkeydown={handleKeydown}>
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[500px] p-8 border border-[rgb(var(--background-color))] rounded grid grid-rows-[auto_1fr_auto] gap-6 overflow-hidden shadow-lg">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2">
        <BrainIcon class="w-[72px] h-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Summarize Text</span>
      </div>

      <!-- Content -->
      <div class="flex flex-col gap-6">
        {#if selectionData.isSelected}
          <div>
            <h3 class="text-base font-semibold mb-2">Selected Text:</h3>
            <div class="px-3 py-2 bg-[rgba(var(--background-color),0.2)] rounded max-h-24 overflow-y-auto text-sm">
              {selectionData.text.length > 200 ? selectionData.text.slice(0, 200) + '...' : selectionData.text}
            </div>
          </div>
        {:else}
          <div class="px-5 py-4 text-center bg-[rgba(var(--background-color),0.2)] rounded text-sm">
            No text selected. Please select text in the editor and try again.
          </div>
        {/if}

        <div class="flex flex-col gap-4">
          <div>
            <label for="api-key" class="block text-sm font-medium mb-1">API Key:</label>
            <input id="api-key" type="password" bind:value={apiKey} placeholder="Enter your OpenRouter API key" class="w-full px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_input))] text-[rgb(var(--font-color))] placeholder:!text-[rgba(var(--font-color),0.6)] text-sm" disabled={isProcessing} />
          </div>
          <div>
            <label for="provider" class="block text-sm font-medium mb-1">AI Provider:</label>
            <select id="provider" bind:value={provider} class="w-full px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_input))] text-[rgb(var(--font-color))] text-sm" disabled={isProcessing}>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>
        </div>

        {#if errorMessage}
          <div class="px-4 py-2 bg-[rgba(244,67,54,0.1)] text-red-600 text-sm rounded border border-red-300/30">
            {errorMessage}
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button type="button" onclick={closeSummarizeModal} disabled={isProcessing} class="px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgba(var(--background-color),0.1)] text-[rgb(var(--font-color))] hover:bg-[rgba(var(--background-color),0.2)] text-sm" variant="outline" size="sm">Cancel</Button>
        <Button type="button" onclick={handleSummarize} disabled={isProcessing || !selectionData.isSelected || !apiKey} class="px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgb(var(--background-color_button-hover))] disabled:opacity-50 disabled:cursor-not-allowed text-sm" variant="outline" size="sm">
          {isProcessing ? 'Summarizing...' : 'Summarize'}
        </Button>
      </div>
    </div>
  </div>
{/if}
