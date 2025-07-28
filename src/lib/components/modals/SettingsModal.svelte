<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from '$lib/components/ui/button';
  import { profile } from '$lib/stores/profile.store';
  import type { Shortcut } from '$lib/models';
  import { modal } from '$lib/stores/modal.store';
  import { toast } from "svelte-sonner";
  import { Input } from "$lib/components/ui/input";
  import { BrainIcon, KeyboardIcon, SettingsIcon} from '@lucide/svelte/icons';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";

  // Using Svelte 5 runes for reactivity
  let shortcuts: Shortcut[] = $state([]);
  let isRecording: boolean = $state(false);
  let recordingEvent: string | null = $state(null);
  let filterText: string = $state('');
  let isSettingsModalOpen: boolean = $state(false);
  let openRouterApiKey: string = $state('');

  // Subscribe to profile & modal changes
  $effect(() => {
    const unsubscribeProfile = profile.subscribe(($profile) => {
      shortcuts = [...$profile.openRouterApiKey];
      openRouterApiKey = $profile.openRouterApiKey || '';
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
    profile.updateProfile({ openrouterApiKey });
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
    modal.closeSettingsModal();
  }
</script>

<!-- SETTINGS DIALOG -->
<Dialog.Root bind:open={isSettingsModalOpen}>
  <Dialog.Portal>
    <!-- Transparent overlay keeps outside‑click close but removes fade -->
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-10" />

    <!-- Centered content card -->
    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[650px] max-h-[90vh] grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] p-8 shadow-lg focus:outline-none z-50"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <SettingsIcon class="w-10 h-10" />
        <h1 class="text-2xl font-semibold">Settings</h1>
        <div class="ml-auto"></div>
      </div>

      <!-- Body with Tabs -->
      <Tabs defaultValue="ai" class="flex flex-col h-full">
        <!-- Tab Triggers -->
        <TabsList class="mb-6 w-full">
          <TabsTrigger value="ai" class="flex-1"><BrainIcon/>AI Settings</TabsTrigger>
          <TabsTrigger value="shortcuts" class="flex-1"><KeyboardIcon/>Keyboard Shortcuts</TabsTrigger>
        </TabsList>

        <!-- AI SETTINGS TAB -->
        <TabsContent value="ai" class="space-y-4 overflow-y-auto">
          <div class="grid gap-6 md:grid-cols-2">
            <div>
              <label for="openrouter-api-key" class="block text-sm font-medium mb-1">OpenRouter API Key</label>
              <Input
                id="openrouter-api-key"
                type="text"
                bind:value={openRouterApiKey}
                placeholder="sk-..."
                class="w-full px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_input))] text-sm"
              />
              <p class="mt-1 text-xs text-[rgb(var(--font-color-secondary))]">Used for text summarization</p>
            </div>

          </div>

          <div class="flex justify-end">
            <Button size="sm" onclick={saveApiKeys}>Save API Keys</Button>
          </div>
        </TabsContent>

        <!-- KEYBOARD SHORTCUTS TAB -->
        <TabsContent value="shortcuts" class="flex-1 flex flex-col overflow-hidden">
          <header class="flex items-center mb-4 gap-4 flex-wrap">
            <Input
              type="text"
              placeholder="Filter shortcuts..."
              bind:value={filterText}
              class="px-3 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_input))] text-sm flex-1 min-w-[200px]"
            />
            <Button variant="ghost" size="sm" onclick={resetToDefaults}>Reset to Defaults</Button>
            <Button size="sm" onclick={saveChanges}>Save Changes</Button>
          </header>

          <div class="flex-1 overflow-y-auto rounded border border-[rgb(var(--background-color))]">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-[rgb(var(--background-color_modalbox))]">
                <tr class="border-b border-[rgb(var(--background-color))]">
                  <th class="p-3 text-left font-semibold">Action</th>
                  <th class="p-3 text-left font-semibold">Shortcut</th>
                  <th class="p-3 text-left font-semibold">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {#each filterShortcuts() as shortcut}
                  <tr class="border-b border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color),0.2)]">
                    <td class="p-3 capitalize">{shortcut.event.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</td>
                    <td class="p-3">
                      {#if isRecording && recordingEvent === shortcut.event}
                        <span class="text-green-600 font-medium">Press keys...</span>
                      {:else}
                        {shortcut.combination}
                      {/if}
                    </td>
                    <td class="p-3 text-right">
                      <Button
                        onclick={() => startRecording(shortcut.event)}
                        disabled={isRecording && recordingEvent !== shortcut.event}
                        size="sm"
                        variant="outline"
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
        </TabsContent>
      </Tabs>

      <!-- Bottom spacer row to keep grid happy -->
      <span class="sr-only">bottom spacer</span>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>