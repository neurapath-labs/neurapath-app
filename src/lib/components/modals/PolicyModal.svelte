<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';

  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);
  let policyContent: string = $state('');

  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isPolicyOpen;
    });
    loadPolicyContent();
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  async function loadPolicyContent() {
    try {
      const response = await fetch('/text/privacy.txt');
      policyContent = await response.text();
    } catch (error) {
      console.error('Failed to load policy content:', error);
      policyContent = 'Failed to load policy content. Please try again later.';
    }
  }

  function closePolicy() {
    ui.closePolicy();
  }

  function handleAgree() {
    closePolicy();
  }
</script>

{#if isOpen}
  <div id="modalbox-tos" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[400px] h-[400px] max-h-[600px] p-8 border border-[rgb(var(--background-color))] rounded grid grid-rows-[auto_1fr_auto] overflow-hidden">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-4">
        <img src="/img/law.svg" alt="Terms of agreement icon" class="w-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Terms of agreement</span>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto pr-2 mr-[-8px] text-sm" innerHTML={policyContent}></div>

      <!-- Action -->
      <div class="flex justify-center mt-4">
        <button
          type="button"
          on:click={handleAgree}
          class="px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] text-sm"
        >
          I agree
        </button>
      </div>
    </div>
  </div>
{/if}
