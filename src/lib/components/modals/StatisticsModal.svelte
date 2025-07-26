<script lang="ts">
  import { database } from '$lib/stores/database.store';
  import { ui } from '$lib/stores/ui.store';
  import { profile } from '$lib/stores/profile.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';

  let items: Record[] = $state([]);
  let isOpen: boolean = $state(false);
  let statisticsData: any = $state({});

  let itemTypeData: { name: string; count: number; color: string }[] = $state([]);
  let repetitionData: { date: string; count: number }[] = $state([]);
  let efactorData: { id: string; efactor: number }[] = $state([]);

  let unsubscribeDatabase: (() => void) | null = null;
  let unsubscribeUI: (() => void) | null = null;
  let unsubscribeProfile: (() => void) | null = null;

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

{#if isOpen}
  <div id="modalbox-statistics" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[400px] h-[600px] max-h-[800px] p-8 border border-[rgb(var(--background-color))] rounded overflow-scroll grid grid-rows-[auto_1fr_auto] gap-6">
      <!-- Header -->
      <div class="flex flex-col items-center gap-2">
        <img src="/img/statistics.svg" alt="Statistics icon" class="w-[72px]" />
        <span class="text-2xl font-semibold whitespace-nowrap">Statistics</span>
      </div>

      <!-- Charts -->
      <div class="flex flex-col gap-8">
        <!-- Item distribution -->
        <div class="flex flex-col items-center gap-4">
          <h3 class="text-lg font-semibold">Item Distribution</h3>
          <div class="flex flex-col items-center gap-4">
            {#if itemTypeData.length}
              {@const segs = calculatePieSegments()}
              <svg width="200" height="200" viewBox="0 0 200 200">
                {#each segs as s}
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke={s.color} stroke-width="40" stroke-dasharray={s.strokeDasharray} stroke-dashoffset={s.strokeDashoffset} transform="rotate(-90 100 100)" />
                {/each}
                <circle cx="100" cy="100" r="60" fill="white" />
              </svg>
              <div class="flex flex-col gap-1 text-sm">
                {#each itemTypeData as it}
                  <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full" style="background:{it.color}"></span>{it.name}: {it.count}</div>
                {/each}
              </div>
            {:else}
              <p class="text-sm">No data available</p>
            {/if}
          </div>
        </div>

        <!-- Daily activity -->
        <div class="flex flex-col items-center gap-4">
          <h3 class="text-lg font-semibold">Daily Activity</h3>
          <div>
            {#if repetitionData.length}
              {@const max = getMaxRepetitionCount()}
              {@const h = 200}
              {@const w = 300}
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
          </div>
        </div>

        <!-- E‑factor -->
        <div class="flex flex-col items-center gap-4">
          <h3 class="text-lg font-semibold">E‑Factor Distribution</h3>
          <div>
            {#if efactorData.length}
              {@const maxE = getMaxEFactor()}
              {@const h = 200}
              {@const w = 300}
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
          </div>
        </div>
      </div>

      <!-- Close -->
      <div class="flex justify-center">
        <button type="button" on:click={closeStatistics} class="px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] text-sm">Close</button>
      </div>
    </div>
  </div>
{/if}
