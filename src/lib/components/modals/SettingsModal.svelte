<script lang="ts">
  import { profile } from '$lib/stores/profile.store';
  import type { Shortcut } from '$lib/models';
  import { modal } from '$lib/stores/modal.store';

  // Using Svelte 5 runes for reactivity
  let shortcuts: Shortcut[] = $state([]);
  let isRecording: boolean = $state(false);
  let recordingEvent: string | null = $state(null);
  let filterText: string = $state('');
  let isSettingsModalOpen: boolean = $state(false);
  let openaiApiKey: string = $state('');
  let anthropicApiKey: string = $state('');

  // Subscribe to profile changes
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

  // Function to format key combination for display
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

    // Map keyCode to readable key name
    const keyMap: { [key: number]: string } = {
      8: 'Backspace',
      9: 'Tab',
      13: 'Enter',
      16: 'Shift',
      17: 'Ctrl',
      18: 'Alt',
      27: 'Escape',
      32: 'Space',
      37: 'Left',
      38: 'Up',
      39: 'Right',
      40: 'Down',
      46: 'Delete',
      113: 'F2',
      114: 'F3',
      115: 'F4',
      116: 'F5',
      117: 'F6',
      118: 'F7',
      119: 'F8',
      120: 'F9',
      121: 'F10',
      122: 'F11',
      123: 'F12'
    };

    const keyName = keyMap[shortcut.keyCode] || String.fromCharCode(shortcut.keyCode);
    combination += keyName;

    return combination;
  }

  // Function to start recording a new shortcut
  function startRecording(event: string) {
    isRecording = true;
    recordingEvent = event;

    // Add temporary event listener to capture the key combination
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();

      // Create new shortcut object
      const newShortcut: Shortcut = {
        event: event,
        keyCode: e.keyCode,
        altKey: e.altKey,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        shift: e.shiftKey,
        combination: formatKeyCombination({
          event: event,
          keyCode: e.keyCode,
          altKey: e.altKey,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shift: e.shiftKey,
          combination: ''
        } as Shortcut)
      };

      // Update the shortcut in the local array
      shortcuts = shortcuts.map(s =>
        s.event === event ? newShortcut : s
      );

      // Stop recording
      isRecording = false;
      recordingEvent = null;

      // Remove event listener
      window.removeEventListener('keydown', handleKeyDown);
    };

    window.addEventListener('keydown', handleKeyDown);
  }

  // Function to save changes
  function saveChanges() {
    // Update each shortcut in the profile store
    shortcuts.forEach(shortcut => {
      profile.updateShortcut(shortcut.event, shortcut);
    });

    toast('Keyboard shortcuts saved successfully');
  }

  // Function to save API keys
  function saveApiKeys() {
    profile.updateProfile({
      openaiApiKey,
      anthropicApiKey
    });
    toast('API keys saved successfully');
  }

  // Function to reset to default shortcuts
  function resetToDefaults() {
    profile.resetShortcutsToDefault();
    toast('Keyboard shortcuts reset to defaults');
  }

  // Function to filter shortcuts
  function filterShortcuts() {
    if (!filterText) return shortcuts;

    const lowerFilter = filterText.toLowerCase();
    return shortcuts.filter(shortcut =>
      shortcut.event.toLowerCase().includes(lowerFilter) ||
      shortcut.combination.toLowerCase().includes(lowerFilter)
    );
  }

  // Function to close the modal
  function closeSettings() {
    modal.closeSettingsModal();
  }
</script>

{#if isSettingsModalOpen}
  <div id="modalbox-settings" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[600px] h-[500px] grid grid-rows-[auto_1fr_auto] p-8 border border-[rgb(var(--background-color))] rounded overflow-hidden">
      <div class="flex flex-col items-center gap-2 mb-5">
        <img class="w-[72px]" src="/img/settings.svg" alt="Settings icon" />
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
                    <td class="p-3">{shortcut.event.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td class="p-3">
                      {#if isRecording && recordingEvent === shortcut.event}
                        <span class="text-green-600 font-bold">Press keys...</span>
                      {:else}
                        {shortcut.combination}
                      {/if}
                    </td>
                    <td class="p-3">
                      <button
                        class="px-3 py-1 text-xs rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(var(--background-color_button-hover))]"
                        on:click={() => startRecording(shortcut.event)}
                        disabled={isRecording && recordingEvent !== shortcut.event}
                        type="button"
                      >
                        {#if isRecording && recordingEvent === shortcut.event}
                          Recording...
                        {:else}
                          Change
                        {/if}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="flex justify-between mb-5">
            <button
              class="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              on:click={resetToDefaults}
              type="button"
            >
              Reset to Defaults
            </button>
            <button
              class="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
              on:click={saveChanges}
              type="button"
            >
              Save Changes
            </button>
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
            <button
              class="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
              on:click={saveApiKeys}
              type="button"
            >
              Save API Keys
            </button>
          </div>
        </div>
      </div>

      <button
        class="absolute bottom-4 left-1/2 -translate-x-1/2 border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] px-4 py-2 rounded hover:bg-[rgba(var(--background-color_button-hover))]"
        on:click={closeSettings}
        type="button"
      >
        Close
      </button>
    </div>
  </div>
{/if}
