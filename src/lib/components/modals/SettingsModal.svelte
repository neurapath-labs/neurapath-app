<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from '$lib/components/ui/button';
  import { profile } from '$lib/stores/profile.store';
  import type { Shortcut } from '$lib/models';
  import { modal } from '$lib/stores/modal.store';
  import SettingsIcon from '@lucide/svelte/icons/settings';

  // Using Svelte 5 runes for reactivity
  let shortcuts: Shortcut[] = $state([]);
  let isRecording: boolean = $state(false);
  let recordingEvent: string | null = $state(null);
  let filterText: string = $state('');
  let isSettingsModalOpen: boolean = $state(false);
  let openaiApiKey: string = $state('');
  let anthropicApiKey: string = $state('');

  // Subscribe to profile & modal changes
  $effect(() => {
    const unsubscribeProfile = profile.subscribe(($profile) => {
      shortcuts = [...$profile.shortcuts];
      openaiApiKey = $profile.openaiApiKey || '';
      anthropicApiKey = $profile.anthropicApiKey || '';
    });

    const unsubscribeModal = modal.subscribe(($modal) => {
      isSettingsModalOpen = $modal.isSettingsModalOpen;
    });

    return () => {
      unsubscribeProfile();
      unsubscribeModal();
    };
  });

  /* ---------- Utility & action handlers ---------- */
  function formatKeyCombination(shortcut: Shortcut): string {
    let combination = '';
    if (shortcut.ctrlKey || shortcut.metaKey) {
      combination += 'Ctrl/Cmd + ';
    }
    if (shortcut.shift) {
      combination += 'Shift + ';
    }
    if (shortcut.altKey) {
      combination += 'Alt + ';
    }

    const keyMap: { [key: number]: string } = {
      8: 'Backspace', 9: 'Tab', 13: 'Enter', 16: 'Shift', 17: 'Ctrl', 18: 'Alt',
      27: 'Escape', 32: 'Space', 37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down',
      46: 'Delete', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6',
      118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12'
    };

    const keyName = keyMap[shortcut.keyCode] || String.fromCharCode(shortcut.keyCode);
    combination += keyName;
    return combination;
  }

  function startRecording(event: string) {
    isRecording = true;
    recordingEvent = event;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const newShortcut: Shortcut = {
        event,
        keyCode: e.keyCode,
        altKey: e.altKey,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        shift: e.shiftKey,
        combination: formatKeyCombination({
          event,
          keyCode: e.keyCode,
          altKey: e.altKey,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shift: e.shiftKey,
          combination: ''
        } as Shortcut)
      };

      shortcuts = shortcuts.map((s) => (s.event === event ? newShortcut : s));
      isRecording = false;
      recordingEvent = null;
      window.removeEventListener('keydown', handleKeyDown);
    };

    window.addEventListener('keydown', handleKeyDown);
  }

  function saveChanges() {
    shortcuts.forEach((s) => profile.updateShortcut(s.event, s));
    toast('Keyboard shortcuts saved successfully');
  }

  function saveApiKeys() {
    profile.updateProfile({ openaiApiKey, anthropicApiKey });
    toast('API keys saved successfully');
  }

  function resetToDefaults() {
    profile.resetShortcutsToDefault();
    toast('Keyboard shortcuts reset to defaults');
  }

  function filterShortcuts() {
    if (!filterText) return shortcuts;
    const lower = filterText.toLowerCase();
    return shortcuts.filter((s) =>
      s.event.toLowerCase().includes(lower) || s.combination.toLowerCase().includes(lower)
    );
  }

  function closeSettings() {
    modal.closeSettingsModal(); // keeps store authority
  }
</script>

<!-- SETTINGS DIALOG -->
<Dialog.Root bind:open={isSettingsModalOpen}>
  <!-- Optional external trigger could live elsewhere; omit here -->
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

    <Dialog.Content class="fixed inset-0 flex items-center justify-center z-50 focus:outline-none">
      <div
        class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[600px] h-[500px] grid grid-rows-[auto_1fr_auto] p-8 border border-[rgb(var(--background-color))] rounded overflow-hidden"
      >
        <!-- Header -->
        <div class="flex flex-col items-center gap-2 mb-5">
          <SettingsIcon class="w-[72px] h-[72px]" />
          <span class="text-2xl font-semibold whitespace-nowrap">Settings</span>
        </div>

        <div class="flex flex-col h-full overflow-hidden">
          <!-- Keyboard Shortcuts Section -->
          <div class="flex flex-col h-full">
            <div class="flex justify-between items-center mb-5">
              <h2 class="text-lg font-bold">Keyboard Shortcuts</h2>
              <input
                type="text"
                placeholder="Filter shortcuts..."
                bind:value={filterText}
                class="px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color))] text-[rgb(var(--font-color))] text-sm"
              />
            </div>

            <div class="flex-1 overflow-y-auto mb-5">
              <table class="w-full table-auto text-sm">
                <thead>
                  <tr class="border-b-2 border-[rgb(var(--background-color))]">
                    <th class="text-left p-3 font-bold">Action</th>
                    <th class="text-left p-3 font-bold">Shortcut</th>
                    <th class="text-left p-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each filterShortcuts() as shortcut}
                    <tr class="border-b border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color),0.5)]">
                      <td class="p-3">
                        {shortcut.event
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </td>
                      <td class="p-3">
                        {#if isRecording && recordingEvent === shortcut.event}
                          <span class="text-green-600 font-bold">Press keys...</span>
                        {:else}
                          {shortcut.combination}
                        {/if}
                      </td>
                      <td class="p-3">
                        <Button
                          class="px-3 py-1 text-xs rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(var(--background-color_button-hover))]"
                          on:click={() => startRecording(shortcut.event)}
                          disabled={isRecording && recordingEvent !== shortcut.event}
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          {#if isRecording && recordingEvent === shortcut.event}
                            Recording...
                          {:else}
                            Change
                          {/if}
                        </Button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <div class="flex justify-between mb-5">
              <Button
                class="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                on:click={resetToDefaults}
                type="button"
                variant="destructive"
                size="sm"
              >
                Reset to Defaults
              </Button>
              <Button
                class="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                on:click={saveChanges}
                type="button"
                size="sm"
              >
                Save Changes
              </Button>
            </div>
          </div>

          <!-- AI Settings Section -->
          <div class="border-t border-[rgb(var(--background-color))] pt-5">
            <h2 class="text-lg font-bold mb-5">AI Service Settings</h2>

            <div class="mb-5">
              <label for="openai-api-key" class="block text-sm font-medium mb-1">OpenAI API Key:</label>
              <input
                type="password"
                id="openai-api-key"
                bind:value={openaiApiKey}
                placeholder="Enter your OpenAI API key"
                class="w-full px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_input))] text-[rgb(var(--font-color))] text-sm mb-1"
              />
              <p class="text-xs text-[rgb(var(--font-color-secondary))] mb-3">
                Used for text summarization with GPT-3.5. Get your API key from the OpenAI dashboard.
              </p>
            </div>

            <div class="mb-5">
              <label for="anthropic-api-key" class="block text-sm font-medium mb-1">Anthropic API Key:</label>
              <input
                type="password"
                id="anthropic-api-key"
                bind:value={anthropicApiKey}
                placeholder="Enter your Anthropic API key"
                class="w-full px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_input))] text-[rgb(var(--font-color))] text-sm mb-1"
              />
              <p class="text-xs text-[rgb(var(--font-color-secondary))] mb-3">
                Used for text summarization with Claude. Get your API key from the Anthropic console.
              </p>
            </div>

            <div class="flex justify-end mb-5">
              <Button
                class="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                on:click={saveApiKeys}
                type="button"
                size="sm"
              >
                Save API Keys
              </Button>
            </div>
          </div>
        </div>

        <!-- Close button wrapped with Dialog.Close for ESC/overlay parity -->
        <Dialog.Close asChild>
          <Button
            class="absolute bottom-4 left-1/2 -translate-x-1/2 border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] px-4 py-2 rounded hover:bg-[rgba(var(--background-color_button-hover))]"
            type="button"
            variant="outline"
            on:click={closeSettings}
          >
            Close
          </Button>
        </Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
