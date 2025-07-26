<script lang="ts">
  // UI libs
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from '$lib/components/ui/button';
  import { BarChartIcon } from '@lucide/svelte/icons';

  // Charts (shadcn‑svelte / LayerChart)
  import * as Chart from "$lib/components/ui/chart/index.js";
  import { PieChart } from 'layerchart';

  // Stores
  import { database } from '$lib/stores/database.store';
  import { ui } from '$lib/stores/ui.store';
  import { profile } from '$lib/stores/profile.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';

  // =====================================
  // Reactive state -----------------------
  // =====================================
  let items: Record[] = $state([]);
  let isOpen: boolean = $state(false);
  let statisticsData: any = $state({});

  // Pie‑chart data/config
  let pieData: { type: string; count: number; color: string }[] = $state([]);
  let pieConfig: Chart.ChartConfig = $state({});
  let mockMode: boolean = $state(false); // true when using placeholder counts

  // Daily Activity + E‑factor (existing SVG logic kept)
  let repetitionData: { date: string; count: number }[] = $state([]);
  let efactorData: { id: string; efactor: number }[] = $state([]);

  let unsubscribeDatabase: (() => void) | null = null;
  let unsubscribeUI: (() => void) | null = null;
  let unsubscribeProfile: (() => void) | null = null;

  // =====================================
  // Helpers ------------------------------
  // =====================================
  const DISTRIBUTIONS = [
    { label: 'Folders', key: 'Folder', color: '#4e79a7' },
    { label: 'Extracts', key: 'Extract', color: '#f28e2c' },
    { label: 'Clozes', key: 'Cloze', color: '#e15759' },
    { label: 'Occlusions', key: 'Occlusion', color: '#76b7b2' }
  ];

  function buildPieData(): typeof pieData {
    return DISTRIBUTIONS.map(({ label, key, color }) => ({
      type: label,
      count: items.filter((i) => i.contentType === key).length,
      color
    }));
  }

  function ensureMockPieData(data: typeof pieData): typeof pieData {
    if (data.every((d) => d.count === 0)) {
      mockMode = true;
      // simple static placeholder counts; tweak as desired
      return [
        { type: 'Folders', count: 8, color: '#4e79a7' },
        { type: 'Extracts', count: 5, color: '#f28e2c' },
        { type: 'Clozes', count: 3, color: '#e15759' },
        { type: 'Occlusions', count: 2, color: '#76b7b2' }
      ];
    }
    mockMode = false;
    return data;
  }

  function rebuildPieConfig(data: typeof pieData): Chart.ChartConfig {
    return {
      count: { label: 'Items' },
      ...data.reduce((cfg, d) => {
        cfg[d.type] = { label: d.type, color: d.color };
        return cfg;
      }, {} as Record<string, { label: string; color: string }>)
    } as Chart.ChartConfig;
  }

  function initChartData() {
    // --------------------------------------------------------------------
    // Pie chart -----------------------------------------------------------
    pieData = ensureMockPieData(buildPieData());
    pieConfig = rebuildPieConfig(pieData);

    // --------------------------------------------------------------------
    // Daily activity (repetitionData) ------------------------------------
    repetitionData = [];
    if (statisticsData && typeof statisticsData === 'object') {
      Object.keys(statisticsData).forEach((d) => {
        const s = statisticsData[d];
        repetitionData.push({
          date: d,
          count: (s.reviewsCount || 0) + (s.newItemsCount || 0)
        });
      });
      repetitionData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (repetitionData.length > 10) repetitionData = repetitionData.slice(-10);
    }

    // --------------------------------------------------------------------
    // E‑factor -----------------------------------------------------------
    efactorData = items
      .filter((i) => ['Cloze', 'Extract', 'Occlusion'].includes(i.contentType) && i.efactor !== undefined)
      .map((i) => ({ id: i.id, efactor: i.efactor || 2.5 }))
      .slice(0, 10);
  }

  function getMaxRepetitionCount() {
    return repetitionData.length ? Math.max(...repetitionData.map((d) => d.count)) : 1;
  }
  function getMaxEFactor() {
    return efactorData.length ? Math.max(...efactorData.map((d) => d.efactor)) : 5;
  }

  function closeStatistics() {
    ui.closeStatistics();
  }

  // =====================================
  // Lifecycle ---------------------------
  // =====================================
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
</script>

<!-- STATISTICS DIALOG -->
<Dialog.Root bind:open={isOpen} on:close={closeStatistics}>
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
        <!-- Item Distribution (Pie) -->
        <section class="flex flex-col items-center gap-4">
          <h3 class="text-lg font-semibold">Item Distribution</h3>

          <!-- Always render – pieData is ensured to have non‑zero values -->
          <Chart.Container config={pieConfig} class="h-[300px] w-full max-w-[350px]">
            <PieChart
              data={pieData}
              key="type"
              value="count"
              c="color"
              legend
              innerRadius={60}
              padding={29}
              props={{ pie: { motion: 'tween' } }}
            >
              {#snippet tooltip()}
                <Chart.Tooltip />
              {/snippet}
            </PieChart>
          </Chart.Container>

          {#if mockMode}
            <p class="text-xs italic text-muted-foreground">Showing example data – add items to see real stats</p>
          {/if}
        </section>

        <!-- Daily Activity (existing SVG) -->
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

        <!-- E‑factor Distribution (existing SVG) -->
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