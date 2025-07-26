<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from '$lib/components/ui/button';
  import { database } from '$lib/stores/database.store';
  import { ui } from '$lib/stores/ui.store';
  import { profile } from '$lib/stores/profile.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';
  import BarChartIcon from '@lucide/svelte/icons/bar-chart';

  // reactive state
  let items: Record[] = $state([]);
  let isOpen: boolean = $state(false);
  let statisticsData: any = $state({});

  let itemTypeData: { name: string; count: number; color: string }[] = $state([]);
  let repetitionData: { date: string; count: number }[] = $state([]);
  let efactorData: { id: string; efactor: number }[] = $state([]);

  let unsubscribeDatabase: (() => void) | null = null;
  let unsubscribeUI: (() => void) | null = null;
  let unsubscribeProfile: (() => void) | null = null;

  // chart helpers
  function initChartData() {
    const folderCount = items.filter((i) => i.contentType === 'Folder').length;
    const extractCount = items.filter((i) => i.contentType === 'Extract').length;
    const clozeCount = items.filter((i) => i.contentType === 'Cloze').length;
    const occlusionCount = items.filter((i) => i.contentType === 'Occlusion').length;

    itemTypeData = [
      { name: 'Folders', count: folderCount, color: '#4e79a7' },
      { name: 'Extracts', count: extractCount, color: '#f28e2c' },
      { name: 'Clozes', count: clozeCount, color: '#e15759' },
      { name: 'Occlusions', count: occlusionCount, color: '#76b7b2' }
    ];

    repetitionData = [];
    if (statisticsData && typeof statisticsData === 'object') {
      Object.keys(statisticsData).forEach((d) => {
        const s = statisticsData[d];
        repetitionData.push({ date: d, count: (s.reviewsCount || 0) + (s.newItemsCount || 0) });
      });
      repetitionData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (repetitionData.length > 10) repetitionData = repetitionData.slice(-10);
    }

    efactorData = items
      .filter((i) => ['Cloze', 'Extract', 'Occlusion'].includes(i.contentType) && i.efactor !== undefined)
      .map((i) => ({ id: i.id, efactor: i.efactor || 2.5 }))
      .slice(0, 10);
  }

  // lifecycle
  onMount(() => {
    unsubscribeDatabase = database.subscribe(($db) => {
      items = $db.items;
      initChartData();
    });
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isStatisticsOpen;
    });
    unsubscribeProfile = profile.subscribe(($pr) => {
      statisticsData = $pr.statistics;
      initChartData();
    });
  });

  onDestroy(() => {
    unsubscribeDatabase?.();
    unsubscribeUI?.();
    unsubscribeProfile?.();
  });

  function closeStatistics() {
    ui.closeStatistics();
  }

  // utility fns
  function getMaxRepetitionCount() {
    return repetitionData.length ? Math.max(...repetitionData.map((d) => d.count)) : 1;
  }
  function getMaxEFactor() {
    return efactorData.length ? Math.max(...efactorData.map((d) => d.efactor)) : 5;
  }
  function calculatePieSegments() {
    let cum = 0;
    const total = itemTypeData.reduce((s, i) => s + i.count, 0);
    return itemTypeData.map((i) => {
      const pct = total ? (i.count / total) * 100 : 0;
      const dash = `${pct} ${100 - pct}`;
      const offset = -cum;
      cum += pct;
      return { ...i, strokeDasharray: dash, strokeDashoffset: offset };
    });
  }
</script>

<!-- STATISTICS DIALOG -->
<Dialog.Root bind:open={isOpen}>
  <Dialog.Portal>
    <!-- Overlay without dim -->
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-50" />

    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[650px] max-h-[95vh]
             p-6 rounded-lg border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_modalbox))]
             text-[rgb(var(--font-color))] shadow-lg focus:outline-none z-50 grid grid-rows-[auto_1fr_auto] gap-6"
    >
      <!-- Header -->
      <div class="flex items-center gap-3">
        <BarChartIcon class="w-9 h-9" />
        <h1 class="text-2xl font-semibold">Statistics</h1>
      </div>

      <!-- Charts -->
      <div class="flex-1 overflow-y-auto pr-2 space-y-10">
        <!-- Item Distribution -->
        <section class="flex flex-col items-center gap-4">
          <h3 class="text-lg font-semibold">Item Distribution</h3>
          {#if itemTypeData.length}
            {@const segs = calculatePieSegments()}
            <svg width="200" height="200" viewBox="0 0 200 200">
              {#each segs as s}
                <circle cx="100" cy="100" r="80" fill="transparent" stroke={s.color} stroke-width="40" stroke-dasharray={s.strokeDasharray} stroke-dashoffset={s.strokeDashoffset} transform="rotate(-90 100 100)" />
              {/each}
              <circle cx="100" cy="100" r="60" fill="white" />
            </svg>
            <ul class="text-sm space-y-1">
              {#each itemTypeData as it}
                <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:{it.color}"></span>{it.name}: {it.count}</li>
              {/each}
            </ul>
          {:else}
            <p class="text-sm">No data available</p>
          {/if}
        </section>

        <!-- Daily Activity -->
        <section class="flex flex-col items-center gap-4">
          <h3 class="text-lg font-semibold">Daily Activity</h3>
          {#if repetitionData.length}
            {@const max = getMaxRepetitionCount()}
            {@const h = 200}
            {@const w = 320}
            {@const bw = w / repetitionData.length - 10}
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
              {#each repetitionData as d, i}
                {@const bh = max ? (d.count / max) * 160 : 0}
                {@const x = i * (w / repetitionData.length) + 10}
                {@const y = h - bh - 20}
                <rect x={x} y={y} width={bw} height={bh} fill="#4e79a7" />
                <text x={x + bw / 2} y={h - 5} text-anchor="middle" font-size="10">{d.date.split('-')[2]}</text>
                {#if bh > 15}
                  <text x={x + bw / 2} y={y + 15} text-anchor="middle" font-size="10" fill="white">{d.count}</text>
                {/if}
              {/each}
            </svg>
          {:else}
            <p class="text-sm">No activity data available</p>
          {/if}
        </section>

        <!-- E‑factor Distribution -->
        <section class="flex flex-col items-center gap-4">
          <h3 class="text-lg font-semibold">E‑Factor Distribution</h3>
          {#if efactorData.length}
            {@const maxE = getMaxEFactor()}
            {@const h = 200}
            {@const w = 320}
            {@const bw = w / efactorData.length - 10}
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
              {#each efactorData as d, i}
                {@const bh = maxE ? (d.efactor / maxE) * 160 : 0}
                {@const x = i * (w / efactorData.length) + 10}
                {@const y = h - bh - 20}
                <rect x={x} y={y} width={bw} height={bh} fill="#e15759" />
                <text x={x + bw / 2} y={h - 5} text-anchor="middle" font-size="10">{d.id.slice(0, 3)}</text>
              {/each}
            </svg>
          {:else}
            <p class="text-sm">No E‑factor data available</p>
          {/if}
        </section>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
