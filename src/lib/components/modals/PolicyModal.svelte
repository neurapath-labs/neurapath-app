<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';

  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);
  let policyContent: string = $state('');

  // Subscribe to UI changes
  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isPolicyOpen;
    });

    // Load policy content
    loadPolicyContent();
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  // Function to load policy content
  async function loadPolicyContent() {
    try {
      const response = await fetch('/text/privacy.txt');
      policyContent = await response.text();
    } catch (error) {
      console.error('Failed to load policy content:', error);
      policyContent = 'Failed to load policy content. Please try again later.';
    }
  }

  // Function to close the policy modal
  function closePolicy() {
    ui.closePolicy();
  }

  // Function to handle agreement
  function handleAgree() {
    closePolicy();
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-tos">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/law.svg" alt="Terms of agreement icon" />
      <span class="modalbox-title">Terms of agreement</span>
    </div>
    <div class="modalbox-content">
      {policyContent}
    </div>
    <button class="modalbox-button" on:click={handleAgree} type="button">I agree</button>
  </div>
{/if}

<style>
  .modalbox {
    position: absolute;
    overflow: scroll;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 400px;
    height: 400px;
    max-height: 600px;
    left: 50%;
    top: 50%;
    margin-left: -200px;
    margin-top: -400px;
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
    max-height: 300px;
    overflow-y: auto;
  }

  .modalbox-button {
    border-color: rgb(var(--background-color));
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    padding: 10px 15px;
    text-align: center;
    border-radius: 4px;
    align-self: center;
  }

  .modalbox-button:hover {
    background-color: rgba(var(--background-color_button-hover));
    cursor: pointer;
  }

  .visible {
    display: block !important;
  }

  .hidden {
    display: none !important;
  }
</style>