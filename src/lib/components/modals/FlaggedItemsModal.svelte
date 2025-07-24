<script lang="ts">
  import { database } from '$lib/stores/database.store';
  import { ui } from '$lib/stores/ui.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';

  // Using Svelte 5 runes for reactivity
  let items: Record[] = $state([]);
  let isOpen: boolean = $state(false);

  // Subscribe to database and UI changes
  let unsubscribeDatabase: () => void;
  let unsubscribeUI: () => void;

  onMount(() => {
    // Subscribe to database changes
    unsubscribeDatabase = database.subscribe(($database) => {
      items = $database.items.filter(item => item.isFlagged === true);
    });

    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isFlaggedOpen;
    });
  });

  onDestroy(() => {
    if (unsubscribeDatabase) unsubscribeDatabase();
    if (unsubscribeUI) unsubscribeUI();
  });

  // Function to close the flagged items modal
  function closeFlagged() {
    ui.closeFlagged();
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-flagged">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/flagged.svg" alt="Flagged items icon">
      <span class="modalbox-title">Flagged Items</span>
    </div>
    <table id="flagged-list">
      <thead>
        <tr>
          <th>Name</th>
          <th>Repetitions</th>
          <th>E-factor</th>
        </tr>
      </thead>
      <tbody>
        {#each items as item}
          <tr>
            <td>{item.id}</td>
            <td>{item.totalRepetitionCount ?? 0}</td>
            <td>{item.efactor?.toFixed(2) ?? '2.50'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <button class="modalbox-button" on:click={closeFlagged} type="button">Close</button>
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

  .modalbox>table {
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

  .modalbox>tr:nth-child(even) {
    background-color: rgb(var(--background-color));
  }

  .modalbox>tr:hover {
    background-color: rgb(var(--background-color));
    cursor: pointer;
  }

  .modalbox>th {
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