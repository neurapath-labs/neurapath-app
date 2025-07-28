<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { database } from '$lib/stores/database.store';
  import { modal } from '$lib/stores/modal.store';
  import { occlusion } from '$lib/stores/occlusion.store';
  import type { Record, Occlusion } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';
  import ImageIcon from '@lucide/svelte/icons/image';

  /* ─────────────────────────────────────────
     Local state (Svelte 5 runes)
  ──────────────────────────────────────────*/
  let isOpen: boolean = $state(false);
  let imageUrl: string = $state('');
  let occlusions: Occlusion[] = $state([]);
  let activeOcclusion: Occlusion | null = $state(null);

  let canvasElement: HTMLCanvasElement | null = $state(null);
  let imageElement: HTMLImageElement | null = $state(null);

  let isDrawing: boolean = $state(false);
  let startX: number = $state(0);
  let startY: number = $state(0);
  let currentRect:
    | { x: number; y: number; width: number; height: number }
    | null = $state(null);

  /* ─────────────────────────────────────────
     Subscriptions
  ──────────────────────────────────────────*/
  let unsubscribeModal: (() => void) | undefined;
  let unsubscribeOcclusion: (() => void) | undefined;

  onMount(() => {
    // Watch modal visibility
    unsubscribeModal = modal.subscribe(($modal) => {
      isOpen = $modal.isOcclusionCreateModalOpen;

      if (isOpen) {
        // reset local drawing state
        occlusions = [];
        activeOcclusion = null;
        currentRect = null;
        isDrawing = false;

        // pull image URL once when modal opens
        const unsub = occlusion.subscribe(($o) => {
          imageUrl = $o.imageUrl || '';
        });
        unsub();
      }
    });

    // Keep occlusion list in sync
    unsubscribeOcclusion = occlusion.subscribe(($o) => {
      occlusions = $o.occlusions;
      activeOcclusion = $o.activeOcclusion;
    });
  });

  onDestroy(() => {
    unsubscribeModal?.();
    unsubscribeOcclusion?.();
  });

  /* ─────────────────────────────────────────
     Canvas helpers
  ──────────────────────────────────────────*/
  function handleImageLoad() {
    if (imageElement && canvasElement) {
      canvasElement.width = imageElement.naturalWidth;
      canvasElement.height = imageElement.naturalHeight;
      redrawCanvas();
    }
  }

  function redrawCanvas() {
    if (!canvasElement || !imageElement) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(imageElement, 0, 0);

    // existing occlusions
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    for (const o of occlusions) {
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.strokeRect(o.x, o.y, o.width, o.height);
    }

    // rectangle while drawing
    if (currentRect) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      );
      ctx.strokeRect(
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      );
    }
  }

  function handleMouseDown(event: MouseEvent) {
    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    startX = event.clientX - rect.left;
    startY = event.clientY - rect.top;
    isDrawing = true;
    currentRect = { x: startX, y: startY, width: 0, height: 0 };
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDrawing || !canvasElement || !currentRect) return;
    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    currentRect.x = Math.min(startX, x);
    currentRect.y = Math.min(startY, y);
    currentRect.width = Math.abs(x - startX);
    currentRect.height = Math.abs(y - startY);
    redrawCanvas();
  }

  function handleMouseUp() {
    if (!isDrawing || !currentRect) return;
    isDrawing = false;

    if (currentRect.width > 5 && currentRect.height > 5) {
      occlusion.addOcclusion({ ...currentRect });
    }
    currentRect = null;
    redrawCanvas();
  }

  /* ─────────────────────────────────────────
     Actions
  ──────────────────────────────────────────*/
  function closeImageOcclusion() {
    modal.closeOcclusionCreateModal();
    occlusion.stopCreating();
  }

  function removeOcclusion(index: number) {
    occlusion.removeOcclusion(index);
    redrawCanvas();
  }

  async function saveOcclusion() {
    if (!imageUrl || occlusions.length === 0) return;

    try {
      const newRecord: Record = {
        id: `Occlusion_${Date.now()}`,
        contentType: 'Occlusion',
        url: imageUrl,
        occlusions: [...occlusions]
      };
      await database.addRecord(newRecord);
      closeImageOcclusion();
    } catch (e) {
      console.error('Error saving occlusion:', e);
    }
  }

  function cancelOcclusion() {
    occlusion.clearOcclusions();
    closeImageOcclusion();
  }
</script>

{#if isOpen && imageUrl}
  <!-- ✨ Modal -->
  <div
    id="modalbox-occlusion-create"
    class="
      absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
      z-10 w-[800px] h-[600px] overflow-hidden
      grid grid-rows-[auto_1fr_auto] p-8 rounded
      border border-[rgb(var(--background-color))]
      bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))]
    "
  >
    <!-- Header -->
    <div class="grid place-items-center text-[26px] gap-[10px] mb-5">
      <ImageIcon class="w-6 h-6" />
      <span class="whitespace-nowrap">Create Image Occlusion</span>
    </div>

    <!-- Body -->
    <div
      class="
        grid grid-cols-[1fr_200px] grid-rows-[1fr_auto] gap-5 h-full
      "
    >
      <!-- Canvas + Image -->
      <div
        class="
          relative row-span-2 overflow-auto
          border border-[rgb(var(--background-color))]
        "
      >
        <canvas
          bind:this={canvasElement}
          class="block cursor-crosshair"
          onmousedown={handleMouseDown}
          onmousemove={handleMouseMove}
          onmouseup={handleMouseUp}
          onmouseleave={handleMouseUp}
        ></canvas>

        <img
          bind:this={imageElement}
          src={imageUrl}
          alt="Occlusion visualization"
          class="block w-full h-auto"
          onload={handleImageLoad}
        />
      </div>

      <!-- Occlusion list -->
      <div class="overflow-y-auto">
        <h3 class="mt-0">Occlusions ({occlusions.length})</h3>

        {#if occlusions.length > 0}
          <ul>
            {#each occlusions as _, i}
              <li
                class="
                  flex items-center justify-between
                  p-2 border-b border-[rgb(var(--background-color))]
                "
              >
                <span>Occlusion {i + 1}</span>
                <Button
                  onclick={() => removeOcclusion(i)}
                  type="button"
                  size="sm"
                >
                  Remove
                </Button>
              </li>
            {/each}
          </ul>
        {:else}
          <p>No occlusions created yet. Draw rectangles on the image to create occlusions.</p>
        {/if}
      </div>

      <!-- Buttons -->
      <div class="col-span-2 flex justify-between gap-[10px]">
        <Button onclick={cancelOcclusion} type="button" variant="outline">
          Cancel
        </Button>
        <Button
          onclick={saveOcclusion}
          type="button"
          variant="outline"
          disabled={occlusions.length === 0}
        >
          Save Occlusion
        </Button>
      </div>
    </div>
  </div>
{/if}
