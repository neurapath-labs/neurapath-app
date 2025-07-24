<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';

  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);
  
  type ChangelogEntry = {
    date: string;
    changes: string[];
  };
  
  let changelogEntries: ChangelogEntry[] = $state([
    {
      date: '2020-03-07',
      changes: [
        '+ Added tutorial on launch',
        '+ New theme added (Homebrew)',
        '+ Added autosave for theme selection',
        '+ Added "error correction" in case of fallback',
        '+ Added custom colors for clozes and extracts',
        '+ Added padding option for menu items',
        '- Toolbar has been replaced by a hover bar',
        '- Redesign of notification system',
        '- Improved UI of profile and settings',
        '- Improved the overall user interface',
        '! Fixed positioning of hovering of Wikipedia article',
        '! Fixed layering of left sidebar',
        '! Fixed create folder function',
        '! Fixed login function'
      ]
    },
    {
      date: '2020-02-28',
      changes: [
        '+ Added slider for working window padding in profile page',
        '+ Added upload information in titlebar',
        '+ Added changelog',
        '+ Added custom command for free recall',
        '+ Added statistics',
        '- Improved image loading times',
        '! Fixed right sidebar hidden in app when word selected',
        '! Fixed fast switching which resulted in fallback'
      ]
    },
    {
      date: '2020-02-24',
      changes: [
        '+ Added PDF support (experimental)',
        '+ Added API for Psykologiguiden',
        '+ Added API for MeSH',
        '+ Added toggle for right sidebar',
        '- Imrovements of right sidebar',
        '- Auto select username',
        '- Auto generate of username removed',
        '! Fixed share function for encrypted databases'
      ]
    },
    {
      date: '2020-02-20',
      changes: [
        '+ Added encryption (AES256) for database information',
        '+ Added convertion to WEBP format',
        '+ Added copy text from right sidebar to clipboard',
        '+ Added deflag and flag to right click menu',
        '- Improved flag and deflag function for PWA'
      ]
    },
    {
      date: '2020-02-14',
      changes: [
        '+ Added flag item option',
        '+ Added drag and drop support for PDF-files',
        '+ Added button to toggle occlusions in the sidebar',
        '- Now places image in selected folder (if any)',
        '- Minor UI tweaks (for PWA and bug fixes)'
      ]
    },
    {
      date: '2020-02-13',
      changes: [
        '+ Postpone for items',
        '+ Create image occlusion from similar content',
        '+ Import Wikipedia articles from similar content',
        '+ Anki import (experimental)',
        '+ Quizlet import (experimental)',
        '- Minor PWA fixes for UI',
        '! Fixed rename bug',
        '! Fixed move item bug',
        '! Fixed color of overlay to yellow',
        '! Fixed folder navigation',
        '! Fixed keep folders open during navigation',
        '! Fixed remove function',
        '! Fixed rendering of files when loading db'
      ]
    },
    {
      date: '2020-02-07',
      changes: [
        '+ Added terms of agreement',
        '- Improved UI: hide sidebar during learning on PWA',
        '- Improved UI: only show grading menu during learning',
        '! Fixed login issue when database not loading',
        '! Fixed the footer on mobile app',
        '! Login ID no longer case sensitive'
      ]
    },
    {
      date: '2020-02-02',
      changes: [
        '+ Added selection of item during engage',
        '! Fixed favicon',
        '! Fixed icon for PWA',
        '! Fixed formatting when leaving training mode',
        '! Fixed folder collapse when creating new items'
      ]
    },
    {
      date: '2020-02-01',
      changes: [
        '+ Added function to export and import selected items in sidebar',
        '+ Added toggle of image occlusions during learning',
        '+ Added toggle of clozes during learning',
        '+ Added email at: hi@evecloud.io',
        '! Minor bug fixes for UI components',
        '! Minor bug fixes for learning mode',
        '! Minor bug fixes for the PWA'
      ]
    },
    {
      date: '2020-01-31',
      changes: [
        '+ Added PWA (tested on: iPhone X)',
        '+ Added due today in sidebar',
        '+ Added database explorer (share and browse)',
        '+ Added image occlusion count in profile',
        '+ Added toggle option for extracts in learning mode',
        '+ Added shortcut for text summarization with AI',
        '+ Added card explorer & algoritm to find items',
        '+ Added neural network for text summarization',
        '- Improved database and search database each minute',
        '- Improved the load time when logging in',
        '- Improved backend storage optimization',
        '! Fixed learning mode',
        '! Fixed date formating'
      ]
    },
    {
      date: '2020-01-16',
      changes: [
        '+ Added Spotlight search',
        '+ Added duplicate item for context menu',
        '+ Added image paste function',
        '+ Added multiple image occlusions',
        '+ Added an introduction text when logging in',
        '+ Added additional shortcuts',
        '+ Added text when last saved to cloud',
        '- Improved database, now saved when import completed',
        '- Improved right-click menu',
        '- Improved visuals (higher contrast)',
        '- Improved folder open when new content added',
        '- Minor improvements of the RTE',
        '! Fixed database, now saved when image uploaded',
        '! Fixed rename, now works for images'
      ]
    },
    {
      date: '2020-01-12',
      changes: [
        '+ Update database on paste to quill',
        '+ Updated the user UI of profile',
        '+ Customize keyboard shortcuts',
        '+ Change shortcut to enable user to copy ID',
        '+ Check if shortcut already used before setting',
        '+ Grammar corrections',
        '+ Show image occlusion with space'
      ]
    },
    {
      date: '2020-01-09',
      changes: [
        '+ Added realtime image search of typed text',
        '+ Added displaying image occlusions in the information tree',
        '+ Added display full picture when hovering image',
        '- Improved more accurate filtering',
        '- Improvement of launch time'
      ]
    }
  ]);

  // Subscribe to UI changes
  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isChangelogOpen;
    });
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  // Function to close the changelog modal
  function closeChangelog() {
    ui.closeChangelog();
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-changelog">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/changelog.svg" alt="Changelog icon" />
      <span class="modalbox-title">Changelog</span>
    </div>
    <div class="modalbox-content">
      {#each changelogEntries as entry}
        <p class="modalbox-content-header">{entry.date}</p>
        {#each entry.changes as change}
          <br />{change}
        {/each}
        <br /><br />
      {/each}
    </div>
    <button class="modalbox-button" on:click={closeChangelog} type="button">I'm ready!</button>
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

  .modalbox-content {
    margin-bottom: 20px;
    max-height: 300px;
    overflow-y: auto;
  }

  .modalbox-content-header {
    font-weight: bold;
    margin: 10px 0 5px 0;
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