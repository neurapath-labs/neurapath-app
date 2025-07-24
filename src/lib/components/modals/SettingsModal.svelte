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
    
    modal.showAlert('Keyboard shortcuts saved successfully', 'success');
  }

  // Function to save API keys
  function saveApiKeys() {
    profile.updateProfile({
      openaiApiKey,
      anthropicApiKey
    });
    modal.showAlert('API keys saved successfully', 'success');
  }

  // Function to reset to default shortcuts
  function resetToDefaults() {
    profile.resetShortcutsToDefault();
    modal.showAlert('Keyboard shortcuts reset to defaults', 'success');
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
  <div class="visible modalbox" id="modalbox-settings">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/settings.svg" alt="Settings icon" />
      <span class="modalbox-title">Settings</span>
    </div>
    
    <div class="settings-container">
      <div class="settings-header">
        <h2>Keyboard Shortcuts</h2>
        <div class="filter-container">
          <input
            type="text"
            placeholder="Filter shortcuts..."
            bind:value={filterText}
            class="filter-input"
          />
        </div>
      </div>
      
      <div class="shortcuts-list">
        <table class="shortcuts-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Shortcut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filterShortcuts() as shortcut}
              <tr>
                <td>{shortcut.event.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td>
                  {#if isRecording && recordingEvent === shortcut.event}
                    <span class="recording">Press keys...</span>
                  {:else}
                    {shortcut.combination}
                  {/if}
                </td>
                <td>
                  <button
                    class="record-button"
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
      
      <div class="settings-actions">
        <button class="reset-button" on:click={resetToDefaults} type="button">
          Reset to Defaults
        </button>
        <button class="save-button" on:click={saveChanges} type="button">
          Save Changes
        </button>
      </div>
    </div>
    
    <div class="ai-settings-container">
      <div class="settings-header">
        <h2>AI Service Settings</h2>
      </div>
      
      <div class="api-key-settings">
        <div class="form-group">
          <label for="openai-api-key">OpenAI API Key:</label>
          <input
            type="password"
            id="openai-api-key"
            bind:value={openaiApiKey}
            placeholder="Enter your OpenAI API key"
            class="api-key-input"
          />
          <p class="help-text">
            Used for text summarization with GPT-3.5. Get your API key from the OpenAI dashboard.
          </p>
        </div>
        
        <div class="form-group">
          <label for="anthropic-api-key">Anthropic API Key:</label>
          <input
            type="password"
            id="anthropic-api-key"
            bind:value={anthropicApiKey}
            placeholder="Enter your Anthropic API key"
            class="api-key-input"
          />
          <p class="help-text">
            Used for text summarization with Claude. Get your API key from the Anthropic console.
          </p>
        </div>
        
        <div class="settings-actions">
          <button class="save-button" on:click={saveApiKeys} type="button">
            Save API Keys
          </button>
        </div>
      </div>
    </div>
    
    <button class="modalbox-button" on:click={closeSettings} type="button">Close</button>
  </div>
{/if}

<style>
  .modalbox {
    position: absolute;
    overflow: hidden;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 600px;
    height: 500px;
    left: 50%;
    top: 50%;
    margin-left: -300px;
    margin-top: -250px;
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

  .settings-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .ai-settings-container {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid rgb(var(--background-color));
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .settings-header h2 {
    margin: 0;
  }

  .filter-container {
    display: flex;
    align-items: center;
  }

  .filter-input {
    padding: 8px 12px;
    border: 1px solid rgb(var(--background-color));
    border-radius: 4px;
    background-color: rgb(var(--background-color));
    color: rgb(var(--font-color));
    font-size: 14px;
  }

  .shortcuts-list {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 20px;
  }
  
  .api-key-settings {
    margin-bottom: 20px;
  }

  .shortcuts-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .api-key-input {
    width: 100%;
    padding: 8px;
    border: 1px solid rgb(var(--background-color));
    border-radius: 4px;
    background-color: rgb(var(--background-color_input));
    color: rgb(var(--font-color));
    font-size: 14px;
    margin-bottom: 5px;
  }

  .shortcuts-table th {
    text-align: left;
    padding: 12px;
    border-bottom: 2px solid rgb(var(--background-color));
    font-weight: bold;
  }

  .shortcuts-table td {
    padding: 12px;
    border-bottom: 1px solid rgb(var(--background-color));
  }

  .shortcuts-table tr:hover {
    background-color: rgba(var(--background-color), 0.5);
  }
  
  .help-text {
    font-size: 12px;
    color: rgb(var(--font-color-secondary));
    margin: 5px 0 15px 0;
  }

  .recording {
    color: #4caf50;
    font-weight: bold;
  }

  .record-button {
    padding: 6px 12px;
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    border: 1px solid rgb(var(--background-color));
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .record-button:hover:not(:disabled) {
    background-color: rgba(var(--background-color_button-hover));
  }

  .record-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .settings-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .reset-button {
    padding: 10px 15px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .reset-button:hover {
    background-color: #d32f2f;
  }

  .save-button {
    padding: 10px 15px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .save-button:hover {
    background-color: #45a049;
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