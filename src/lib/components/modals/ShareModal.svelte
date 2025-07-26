<script lang="ts">
  import { Button } from '$lib/components/ui/button';
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
  import Share2Icon from '@lucide/svelte/icons/share-2';

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
      toast('Error loading item data');
    }
  }

  // Function to toggle item public status
  async function togglePublicStatus() {
    if (!targetItem) return;
    isProcessing = true;
    try {
      const newStatus = await toggleItemPublicStatus(targetItem.id);
      isItemPublic = newStatus;
      toast(`Item is now ${newStatus ? 'public' : 'private'}`);
    } catch (error) {
      console.error('Error toggling public status:', error);
      toast('Error toggling public status');
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
        toast('Database is now private');
      } else {
        await makeDatabasePublic();
        isDatabasePublic = true;
        toast('Database is now public');
      }
    } catch (error) {
      console.error('Error toggling database public status:', error);
      toast('Error toggling database public status');
    } finally {
      isProcessing = false;
    }
  }

  // Function to copy shareable link to clipboard
  async function copyLinkToClipboard() {
    if (!shareableLink) return;
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast('Link copied to clipboard', 'success');
    } catch (error) {
      console.error('Error copying link to clipboard:', error);
      toast('Error copying link to clipboard');
    }
  }

  // Function to close the share modal
  function closeShareModal() {
    ui.closeShareModal();
  }
</script>

{#if isOpen}
  <div id="modalbox-share" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[400px] max-h-[600px] p-8 border border-[rgb(var(--background-color))] rounded overflow-scroll">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-5">
        <Share2Icon class="w-[72px] h-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Share Item</span>
      </div>

      {#if targetItem}
        <!-- Item info -->
        <div class="mb-5 p-3 bg-[rgba(var(--background-color),0.5)] rounded">
          <h3 class="text-lg font-semibold mb-2">{targetItem.id}</h3>
          <p class="text-sm text-[rgb(var(--font-color-secondary))] m-0">Type: {targetItem.contentType}</p>
        </div>

        <!-- Item sharing controls -->
        <div class="mb-5">
          <div class="mb-4">
            <label class="font-bold block mb-1">
              <input
                type="checkbox"
                class="mr-2"
                checked={isItemPublic}
                on:change={togglePublicStatus}
                disabled={isProcessing}
              />
              Make this item public
            </label>
            <p class="text-xs text-[rgb(var(--font-color-secondary))] mt-1">
              {isItemPublic
                ? 'This item is currently public and can be accessed by anyone with the link.'
                : 'This item is currently private and can only be accessed by you.'}
            </p>
          </div>

          {#if isItemPublic}
            <div class="mb-4">
              <label for="share-link" class="font-bold block mb-1">Shareable Link:</label>
              <div class="flex gap-2">
                <input
                  id="share-link"
                  type="text"
                  value={shareableLink}
                  readonly
                  class="flex-1 px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_input))] text-[rgb(var(--font-color))] text-sm"
                />
                <Button
                  type="button"
                  on:click={copyLinkToClipboard}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                >
                  Copy
                </Button>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <p class="mb-5">Loading item data...</p>
      {/if}

      <!-- Database sharing controls -->
      <div class="mb-5">
        <h3 class="text-lg font-semibold mb-4">Database Sharing</h3>
        <div class="mb-4">
          <label class="font-bold block mb-1">
            <input
              type="checkbox"
              class="mr-2"
              checked={isDatabasePublic}
              on:change={toggleDatabasePublicStatus}
              disabled={isProcessing}
            />
            Make entire database public
          </label>
          <p class="text-xs text-[rgb(var(--font-color-secondary))] mt-1">
            {isDatabasePublic
              ? 'Your entire database is currently public.'
              : 'Your entire database is currently private.'}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end">
        <Button
          type="button"
          on:click={closeShareModal}
          disabled={isProcessing}
          variant="outline"
        >
          Close
        </Button>
      </div>
    </div>
  </div>
{/if}