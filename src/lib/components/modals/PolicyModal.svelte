<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import { ui } from '$lib/stores/ui.store';
  import ScaleIcon from '@lucide/svelte/icons/scale';
  import CheckIcon from '@lucide/svelte/icons/check';

  // Svelte 5 runes
  let isOpen: boolean = $state(false);
  let policyContent: string = $state('');
  let loadedOnce: boolean = $state(false);

  // Subscribe to UI store for open state
  $effect(() => {
    const unsub = ui.subscribe(($ui) => {
      isOpen = $ui.isPolicyOpen;
    });
    return () => unsub();
  });

  // Load policy text once on client
  $effect(() => {
    if (!loadedOnce && typeof window !== 'undefined') {
      loadedOnce = true;
      loadPolicyContent();
    }
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

  function handleOpenChange(openState: boolean) {
    if (!openState) closePolicy();
  }
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-50" />

    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
             w-[90vw] max-w-[650px] max-h-[90vh]
             grid grid-rows-[auto_1fr_auto] overflow-hidden
             rounded-lg border border-[rgb(var(--background-color))]
             bg-[rgb(var(--background-color_modalbox))]
             text-[rgb(var(--font-color))] p-8 shadow-lg focus:outline-none z-50"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <ScaleIcon class="w-10 h-10" />
        <h1 class="text-2xl font-semibold">Terms of agreement</h1>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto pr-1 text-sm">
        {@html policyContent}
      </div>

      <!-- Footer -->
      <div class="mt-6 flex justify-end gap-2">
        <Button type="button" onclick={handleAgree} class="cursor-pointer" variant="outline" size="sm">
          <CheckIcon class="mr-2 size-4" />
          I agree
        </Button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
