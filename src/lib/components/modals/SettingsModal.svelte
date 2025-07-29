<script lang="ts">
  /* ───────────────────────────── imports ───────────────────────────── */
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button }  from "$lib/components/ui/button";
  import { Input }   from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Tabs, TabsContent, TabsList, TabsTrigger }
          from "$lib/components/ui/tabs";

  import { profile } from "$lib/stores/profile.store";
  import { modal   } from "$lib/stores/modal.store";
  import { toast   } from "svelte-sonner";

  import { BrainIcon, KeyboardIcon, SettingsIcon, SaveIcon, Loader2Icon }
          from "@lucide/svelte/icons";

  import type { Shortcut } from "$lib/models";

  /* ──────────────────────────── state ─────────────────────────────── */
  let shortcuts:       Shortcut[] = $state([]);
  let isRecording:     boolean    = $state(false);
  let recordingEvent:  string | null = $state(null);

  let filterText:      string     = $state('');
  let isSettingsModalOpen         = $state(false);

  // AI settings
  let openRouterApiKey = $state('');
  let openRouterModel  = $state('openai/gpt-3.5-turbo');
  let isSaving = $state(false);
  
  // Debug: Log when these values change
  $effect(() => {
    console.log("openRouterApiKey state:", openRouterApiKey);
    console.log("openRouterModel state:", openRouterModel);
  });

  /* ─────────────── model options & derived trigger label ──────────── */
  const models = [
    { value: "openai/gpt-3.5-turbo",        label: "GPT-3.5 Turbo" },
    { value: "openai/gpt-4o",               label: "GPT-4o" },
    { value: "mistral/mistral-large-latest",label: "Mistral Large" },
    { value: "anthropic/claude-3-sonnet",   label: "Claude 3 Sonnet" },
  ];

  const modelTriggerContent = $derived(
    models.find((m) => m.value === openRouterModel)?.label ?? "Select a model"
  );

  /* ───────────── subscribe to external stores (profile, modal) ────── */
  $effect(() => {
    const unsubProfile = profile.subscribe(($p) => {
      console.log("Profile updated in SettingsModal:", $p);
      shortcuts        = [...($p.shortcuts ?? [])];
      openRouterApiKey = $p.openRouterApiKey || '';
      openRouterModel  = $p.openRouterModel || 'openai/gpt-3.5-turbo';
      console.log("openRouterApiKey:", openRouterApiKey);
      console.log("openRouterModel:", openRouterModel);
    });

    const unsubModal = modal.subscribe(($m) => {
      isSettingsModalOpen = $m.isSettingsModalOpen;
    });

    return () => { unsubProfile(); unsubModal(); };
  });

  /* ──────────────────────── utility / handlers ────────────────────── */
  function formatKeyCombination(s: Shortcut): string {
    let combo = '';
    if (s.ctrlKey || s.metaKey) combo += 'Ctrl/Cmd + ';
    if (s.shift)                combo += 'Shift + ';
    if (s.altKey)               combo += 'Alt + ';

    const keyMap: Record<number,string> = {
      8:'Backspace',9:'Tab',13:'Enter',16:'Shift',17:'Ctrl',18:'Alt',27:'Escape',32:'Space',
      37:'Left',38:'Up',39:'Right',40:'Down',46:'Delete',113:'F2',114:'F3',115:'F4',
      116:'F5',117:'F6',118:'F7',119:'F8',120:'F9',121:'F10',122:'F11',123:'F12'
    };
    const keyName = keyMap[s.keyCode] ?? String.fromCharCode(s.keyCode);
    return combo + keyName;
  }

  function startRecording(event: string) {
    isRecording = true;
    recordingEvent = event;

    const handle = (e: KeyboardEvent) => {
      e.preventDefault();
      const newShortcut: Shortcut = {
        event,
        keyCode:  e.keyCode,
        altKey:   e.altKey,
        ctrlKey:  e.ctrlKey,
        metaKey:  e.metaKey,
        shift:    e.shiftKey,
        combination: ''
      };
      newShortcut.combination = formatKeyCombination(newShortcut);

      shortcuts      = shortcuts.map(s => s.event === event ? newShortcut : s);
      isRecording    = false;
      recordingEvent = null;
      window.removeEventListener('keydown', handle);
    };

    window.addEventListener('keydown', handle);
  }

  function saveShortcutChanges() {
    shortcuts.forEach(s => profile.updateShortcut(s.event, s));
    toast('Keyboard shortcuts saved');
  }

  async function saveAiSettings() {
    isSaving = true;
    try {
      console.log("Saving AI settings:", { openRouterApiKey, openRouterModel });
      // Save AI settings to profile
      profile.updateProfile({ openRouterApiKey, openRouterModel });
      
      toast('AI settings saved');
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast('Error saving AI settings');
    } finally {
      isSaving = false;
    }
  }

  function resetToDefaults() {
    profile.resetShortcutsToDefault();
    toast('Shortcuts reset to defaults');
  }

  function filterShortcuts() {
    if (!filterText) return shortcuts;
    const lower = filterText.toLowerCase();
    return shortcuts.filter(s =>
      s.event.toLowerCase().includes(lower) ||
      s.combination.toLowerCase().includes(lower)
    );
  }

</script>

<!-- ───────────────────────────── dialog ───────────────────────────── -->
<Dialog.Root bind:open={isSettingsModalOpen}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-10" />

    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
             w-[90vw] max-w-[650px] max-h-[90vh]
             grid grid-rows-[auto_1fr_auto] overflow-hidden
             rounded-lg border border-[rgb(var(--background-color))]
             bg-[rgb(var(--background-color_modalbox))]
             text-[rgb(var(--font-color))] p-8 shadow-lg z-50"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <SettingsIcon class="w-10 h-10" />
        <h1 class="text-2xl font-semibold">Settings</h1>
        <div class="ml-auto" />
      </div>

      <!-- Tabs -->
      <Tabs value="ai" class="flex flex-col h-full">
        <TabsList class="mb-6 w-full">
          <TabsTrigger value="ai"        class="flex-1"><BrainIcon/>AI&nbsp;Settings</TabsTrigger>
          <TabsTrigger value="shortcuts" class="flex-1"><KeyboardIcon/>Keyboard&nbsp;Shortcuts</TabsTrigger>
        </TabsList>

        <!-- AI SETTINGS TAB -->
        <TabsContent value="ai" class="space-y-4 overflow-y-auto">
          <div class="grid gap-6 md:grid-cols-2">
            <!-- API Key -->
            <div>
              <label for="openrouter-api-key" class="block text-sm font-medium mb-1">
                OpenRouter&nbsp;API&nbsp;Key
              </label>
              <Input
                id="openrouter-api-key"
                type="text"
                bind:value={openRouterApiKey}
                placeholder="sk-..."
                class="w-full px-3 py-2 rounded border border-[rgb(var(--background-color))]
                       bg-[rgb(var(--background-color_input))] text-sm"
              />
              <p class="mt-1 text-xs text-[rgb(var(--font-color-secondary))]">
                Used for text summarization
              </p>
            </div>

            <!-- Model Select -->
            <div>
              <label for="openrouter-model" class="block text-sm font-medium mb-1">
                Model
              </label>
              <!-- Shadcn Select, matches the fruit example -->
              <Select.Root
                type="single"
                name="openRouterModel"
                bind:value={openRouterModel}
              >
                <Select.Trigger class="w-full">
                  {modelTriggerContent}
                </Select.Trigger>

                <Select.Content>
                  <Select.Group>
                    <Select.Label>Models</Select.Label>
                    {#each models as m (m.value)}
                      <Select.Item value={m.value} label={m.label}>
                        {m.label}
                      </Select.Item>
                    {/each}
                  </Select.Group>
                </Select.Content>
              </Select.Root>

              <p class="mt-1 text-xs text-[rgb(var(--font-color-secondary))]">
                Default model for summarization
              </p>
            </div>
          </div>

          <div class="flex justify-end">
            <Button size="sm" onclick={saveAiSettings} disabled={isSaving}>
              {#if isSaving}
                <Loader2Icon class="w-4 h-4 mr-2 animate-spin" />
                Saving...
              {:else}
                <SaveIcon class="w-4 h-4 mr-2" />
                Save&nbsp;AI&nbsp;Settings
              {/if}
            </Button>
          </div>
        </TabsContent>

        <!-- KEYBOARD SHORTCUTS TAB -->
        <TabsContent value="shortcuts" class="flex-1 flex flex-col overflow-hidden">
          <!-- Toolbar -->
          <header class="flex items-center mb-4 gap-4 flex-wrap">
            <Input
              type="text"
              placeholder="Filter shortcuts…"
              bind:value={filterText}
              class="px-3 py-2 rounded border border-[rgb(var(--background-color))]
                     bg-[rgb(var(--background-color_input))] text-sm flex-1 min-w-[200px]"
            />
            <Button variant="ghost" size="sm" onclick={resetToDefaults}>Reset to Defaults</Button>
            <Button size="sm" onclick={saveShortcutChanges}>Save Changes</Button>
          </header>

          <!-- Shortcuts table -->
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
                    <td class="p-3 capitalize">
                      {shortcut.event
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </td>
                    <td class="p-3">
                      {#if isRecording && recordingEvent === shortcut.event}
                        <span class="text-green-600 font-medium">Press keys…</span>
                      {:else}
                        {shortcut.combination}
                      {/if}
                    </td>
                    <td class="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isRecording && recordingEvent !== shortcut.event}
                        onclick={() => startRecording(shortcut.event)}
                      >
                        {#if isRecording && recordingEvent === shortcut.event}
                          Recording…
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

      <!-- Spacer to satisfy grid -->
      <span class="sr-only">bottom spacer</span>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
