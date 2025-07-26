<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { database } from '$lib/stores/database.store';
  import { modal } from '$lib/stores/modal.store';
  import { occlusion } from '$lib/stores/occlusion.store';
  import type { Record, Occlusion } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';
  import ImageIcon from '@lucide/svelte/icons/image';

  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);
  let imageUrl: string = $state('');
  let occlusions: Occlusion[] = $state([]);
  let activeOcclusion: Occlusion | null = $state(null);
  let canvasElement: HTMLCanvasElement | null = $state(null);
  let imageElement: HTMLImageElement | null = $state(null);
  let isDrawing: boolean = $state(false);
  let startX: number = $state(0);
  let startY: number = $state(0);
  let currentRect: { x: number; y: number; width: number; height: number } | null = $state(null);

  // Subscribe to modal and occlusion changes
  let unsubscribeModal: (() => void) | undefined;
  let unsubscribeOcclusion: (() => void) | undefined;

  onMount(() => {
    // Subscribe to modal changes
    unsubscribeModal = modal.subscribe(($modal) => {
      isOpen = $modal.isOcclusionCreateModalOpen;
      if (isOpen) {
        // Reset state when modal opens
        occlusions = [];
        activeOcclusion = null;
        currentRect = null;
        isDrawing = false;
        
        // Get image URL from occlusion store
        const unsubscribe = occlusion.subscribe(($occlusion) => {
          imageUrl = $occlusion.imageUrl || '';
        });
        unsubscribe();
      }
    });

    // Subscribe to occlusion changes
    unsubscribeOcclusion = occlusion.subscribe(($occlusion) => {
      occlusions = $occlusion.occlusions;
      activeOcclusion = $occlusion.activeOcclusion;
    });
  });

  onDestroy(() => {
    if (unsubscribeModal) unsubscribeModal();
    if (unsubscribeOcclusion) unsubscribeOcclusion();
  });

  // Function to close the image occlusion modal
  function closeImageOcclusion() {
    modal.closeOcclusionCreateModal();
    occlusion.stopCreating();
  }

  // Function to handle image load
  function handleImageLoad() {
    if (imageElement && canvasElement) {
      // Set canvas dimensions to match image
      canvasElement.width = imageElement.naturalWidth;
      canvasElement.height = imageElement.naturalHeight;
      redrawCanvas();
    }
  }

  // Function to redraw the canvas
  function redrawCanvas() {
    if (!canvasElement || !imageElement) return;
    
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw image
    ctx.drawImage(imageElement, 0, 0);
    
    // Draw existing occlusions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < occlusions.length; i++) {
      const occlusionItem = occlusions[i];
      ctx.fillRect(occlusionItem.x, occlusionItem.y, occlusionItem.width, occlusionItem.height);
      ctx.strokeRect(occlusionItem.x, occlusionItem.y, occlusionItem.width, occlusionItem.height);
    }
    
    // Draw current rectangle if drawing
    if (currentRect) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
  }

  // Function to handle mouse down on canvas
  function handleMouseDown(event: MouseEvent) {
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    startX = event.clientX - rect.left;
    startY = event.clientY - rect.top;
    isDrawing = true;
    currentRect = {
      x: startX,
      y: startY,
      width: 0,
      height: 0
    };
  }

  // Function to handle mouse move on canvas
  function handleMouseMove(event: MouseEvent) {
    if (!isDrawing || !canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    if (currentRect) {
      currentRect.x = Math.min(startX, currentX);
      currentRect.y = Math.min(startY, currentY);
      currentRect.width = Math.abs(currentX - startX);
      currentRect.height = Math.abs(currentY - startY);
    }
    
    redrawCanvas();
  }

  // Function to handle mouse up on canvas
  function handleMouseUp() {
    if (!isDrawing) return;
    
    isDrawing = false;
    
    if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
      // Add the occlusion
      occlusion.addOcclusion({
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height
      });
    }
    
    currentRect = null;
    redrawCanvas();
  }

  // Function to remove an occlusion
  function removeOcclusion(index: number) {
    occlusion.removeOcclusion(index);
    redrawCanvas();
  }

  // Function to save the occlusion
  async function saveOcclusion() {
    if (!imageUrl || occlusions.length === 0) return;
    
    try {
      // Create a new record for the image occlusion
      const newRecord: Record = {
        id: `Occlusion_${Date.now()}`,
        contentType: 'Occlusion',
        url: imageUrl,
        occlusions: [...occlusions]
      };
      
      // Add to database
      await database.addRecord(newRecord);
      
      // Close modal
      closeImageOcclusion();
      
      console.log('Occlusion saved successfully');
    } catch (error) {
      console.error('Error saving occlusion:', error);
    }
  }

  // Function to cancel the occlusion creation
  function cancelOcclusion() {
    occlusion.clearOcclusions();
    closeImageOcclusion();
  }
</script>

{#if isOpen && imageUrl}
  <div class="visible modalbox" id="modalbox-occlusion-create">
    <div class="modalbox-header">
      <ImageIcon class="modalbox-icon" />
      <span class="modalbox-title">Create Image Occlusion</span>
    </div>
    
    <div id="modalbox-occlusion-create-wrapper">
      <div id="modalbox-occlusion-create-canvas-container">
        <canvas
          id="modalbox-occlusion-create-canvas"
          bind:this={canvasElement}
          onmousedown={handleMouseDown}
          onmousemove={handleMouseMove}
          onmouseup={handleMouseUp}
          onmouseleave={handleMouseUp}
        ></canvas>
        <img
          id="modalbox-occlusion-create-image"
          bind:this={imageElement}
          src={imageUrl}
          alt="Occlusion visualization"
          onload={handleImageLoad}
        />
      </div>
      
      <div class="occlusion-list">
        <h3>Occlusions ({occlusions.length})</h3>
        {#if occlusions.length > 0}
          <ul>
            {#each occlusions as occlusionItem, i}
              <li class="occlusion-item">
                <span>Occlusion {i + 1}</span>
                <Button class="remove-button" onclick={() => removeOcclusion(i)} type="button" size="sm">Remove</Button>
              </li>
            {/each}
          </ul>
        {:else}
          <p>No occlusions created yet. Draw rectangles on the image to create occlusions.</p>
        {/if}
      </div>
      
      <div class="modalbox-button-container">
        <Button
          class="modalbox-button"
          onclick={cancelOcclusion}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          class="modalbox-button"
          onclick={saveOcclusion}
          type="button"
          disabled={occlusions.length === 0}
          variant="outline"
        >
          Save Occlusion
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modalbox {
    position: absolute;
    overflow: hidden;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 800px;
    height: 600px;
    left: 50%;
    top: 50%;
    margin-left: -400px;
    margin-top: -300px;
    display: grid;
    grid-template-rows: auto 1fr auto;
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

  #modalbox-occlusion-create-wrapper {
    display: grid;
    grid-template-columns: 1fr 200px;
    grid-template-rows: 1fr auto;
    gap: 20px;
    height: 100%;
  }

  #modalbox-occlusion-create-canvas-container {
    grid-row: 1 / span 2;
    position: relative;
    border: 1px solid rgb(var(--background-color));
    overflow: auto;
  }

  #modalbox-occlusion-create-canvas {
    cursor: crosshair;
    display: block;
  }

  .occlusion-list {
    overflow-y: auto;
  }

  .occlusion-list h3 {
    margin-top: 0;
  }

  .occlusion-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid rgb(var(--background-color));
  }

  .remove-button {
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
  }

  .remove-button:hover {
    background-color: rgba(var(--background-color_button-hover));
  }

  .modalbox-button-container {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    grid-column: 1 / span 2;
  }

  .modalbox-button {
    border-color: rgb(var(--background-color));
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    padding: 10px 15px;
    text-align: center;
    border-radius: 4px;
    align-self: center;
    flex: 1;
  }

  .modalbox-button:hover {
    background-color: rgba(var(--background-color_button-hover));
    cursor: pointer;
  }

  .modalbox-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .visible {
    display: block !important;
  }

  /* .hidden {
    display: none !important;
  } */
</style>