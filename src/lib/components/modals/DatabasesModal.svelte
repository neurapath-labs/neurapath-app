<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';
  import { getPublicDatabases } from '$lib/services/database.service';
  import type { Database } from '$lib/models';

  // Using Svelte 5 runes for reactivity
  let databases: Database[] = $state([]);
  let isOpen: boolean = $state(false);
  let isLoading: boolean = $state(false);

  // Subscribe to UI changes
  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isDatabasesOpen;
      if (isOpen && databases.length === 0) {
        loadDatabases();
      }
    });
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  // Function to load public databases
  const loadDatabases = async () => {
    isLoading = true;
    try {
      databases = await getPublicDatabases();
    } catch (error) {
      console.error('Error loading databases:', error);
    } finally {
      isLoading = false;
    }
  };

  // Function to close the databases modal
  function closeDatabases() {
    ui.closeDatabases();
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-databases">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/database.svg" alt="Database icon" />
      <span class="modalbox-title">Shared Databases</span>
    </div>
    <table id="database-list">
      <thead>
        <tr>
          <th>Database</th>
        </tr>
      </thead>
      <tbody>
        {#if isLoading}
          <tr>
            <td>Loading...</td>
          </tr>
        {:else}
          {#each databases as database}
            <tr>
              <td>{database.name || database.id}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
    <button class="modalbox-button" on:click={closeDatabases} type="button">Close</button>
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

  .modalbox > table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 20px;
  }

  .modalbox td,
  .modalbox th {
    border: 0px solid rgb(var(--background-color));
    padding: 8px;
  }

  .modalbox td:hover {
    cursor: pointer;
    font-weight: bold;
  }

  .modalbox > tr:nth-child(even) {
    background-color: rgb(var(--background-color));
  }

  .modalbox > tr:hover {
    background-color: rgb(var(--background-color));
    cursor: pointer;
  }

  .modalbox > th {
    padding-top: 8px;
    padding-bottom: 8px;
    text-align: left;
    background-color: rgb(var(--background-color));
    color: rgb(var(--font-color));
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