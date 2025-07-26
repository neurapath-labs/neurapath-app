<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';

  // Using Svelte 5 runes for reactivity
  let isOpen: boolean = $state(false);

  type ChangelogEntry = {
    date: string;
    changes: string[];
  };

  // Local changelog data (could be fetched from an API later)
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
    // ... (other entries truncated for brevity)
  ]);

  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isChangelogOpen;
    });
  });

  onDestroy(() => {
    if (unsubscribeUI) unsubscribeUI();
  });

  function closeChangelog() {
    ui.closeChangelog();
  }
</script>

{#if isOpen}
  <div id="modalbox-changelog" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[400px] h-[400px] max-h-[600px] p-8 border border-[rgb(var(--background-color))] rounded grid grid-rows-[auto_1fr_auto] overflow-hidden">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2 mb-4">
        <ScrollTextIcon class="w-[72px] h-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Changelog</span>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto pr-2 mr-[-8px]"> <!-- negative margin to compensate scrollbar -->
        {#each changelogEntries as entry}
          <p class="font-bold my-2">{entry.date}</p>
          {#each entry.changes as change}
            <p class="text-sm">{change}</p>
          {/each}
        {/each}
      </div>

      <!-- Action -->
      <div class="flex justify-center mt-4">
        <button
          type="button"
          on:click={closeChangelog}
          class="px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] text-sm"
        >
          I'm ready!
        </button>
      </div>
    </div>
  </div>
{/if}
