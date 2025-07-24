<script lang="ts">
  import { database } from '$lib/stores/database.store';
  import { ui } from '$lib/stores/ui.store';
  import { profile } from '$lib/stores/profile.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';

  // Using Svelte 5 runes for reactivity
  let items: Record[] = $state([]);
  let isOpen: boolean = $state(false);
  let statisticsData: any = $state({});
  
  // Chart data
  let itemTypeData: { name: string; count: number; color: string }[] = $state([]);
  let repetitionData: { date: string; count: number }[] = $state([]);
  let efactorData: { id: string; efactor: number }[] = $state([]);

  // Subscribe to database, UI, and profile changes
  let unsubscribeDatabase: (() => void) | null = null;
  let unsubscribeUI: (() => void) | null = null;
  let unsubscribeProfile: (() => void) | null = null;

  // Initialize chart data
  function initChartData() {
    // Calculate item type distribution
    const folderCount = items.filter(item => item.contentType === 'Folder').length;
    const extractCount = items.filter(item => item.contentType === 'Extract').length;
    const clozeCount = items.filter(item => item.contentType === 'Cloze').length;
    const occlusionCount = items.filter(item => item.contentType === 'Occlusion').length;
    
    itemTypeData = [
      { name: 'Folders', count: folderCount, color: '#4e79a7' },
      { name: 'Extracts', count: extractCount, color: '#f28e2c' },
      { name: 'Clozes', count: clozeCount, color: '#e15759' },
      { name: 'Occlusions', count: occlusionCount, color: '#76b7b2' }
    ];

    // Calculate repetition data from profile statistics
    repetitionData = [];
    if (statisticsData && typeof statisticsData === 'object') {
      Object.keys(statisticsData).forEach(date => {
        const stats = statisticsData[date];
        const totalCount = (stats.reviewsCount || 0) + (stats.newItemsCount || 0);
        repetitionData.push({ date, count: totalCount });
      });
      
      // Sort by date
      repetitionData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Limit to last 10 days for better visualization
      if (repetitionData.length > 10) {
        repetitionData = repetitionData.slice(-10);
      }
    }

    // Calculate E-factor data for learning items
    efactorData = items
      .filter(item => 
        (item.contentType === 'Cloze' || item.contentType === 'Extract' || item.contentType === 'Occlusion') && 
        item.efactor !== undefined
      )
      .map(item => ({
        id: item.id,
        efactor: item.efactor || 2.5
      }))
      .slice(0, 10); // Limit to first 10 items for better visualization
  }

  onMount(() => {
    // Subscribe to database changes
    unsubscribeDatabase = database.subscribe(($database) => {
      items = $database.items;
      initChartData();
    });

    // Subscribe to UI changes
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isStatisticsOpen;
    });
    
    // Subscribe to profile changes for statistics data
    unsubscribeProfile = profile.subscribe(($profile) => {
      statisticsData = $profile.statistics;
      initChartData();
    });
  });

  onDestroy(() => {
    if (unsubscribeDatabase) unsubscribeDatabase();
    if (unsubscribeUI) unsubscribeUI();
    if (unsubscribeProfile) unsubscribeProfile();
  });

  // Function to close the statistics modal
  function closeStatistics() {
    ui.closeStatistics();
  }
  
  // Helper function to get max value in repetition data
  function getMaxRepetitionCount() {
    return repetitionData.length > 0 
      ? Math.max(...repetitionData.map(d => d.count)) 
      : 1;
  }
  
  // Helper function to get max E-factor value
  function getMaxEFactor() {
    return efactorData.length > 0 
      ? Math.max(...efactorData.map(d => d.efactor)) 
      : 5;
  }
  
  // Helper function to calculate pie chart segments
  function calculatePieSegments() {
    let cumulativePercentage = 0;
    const total = itemTypeData.reduce((sum, item) => sum + item.count, 0);
    
    return itemTypeData.map(item => {
      const percentage = total > 0 ? (item.count / total) * 100 : 0;
      const strokeDasharray = `${percentage} ${100 - percentage}`;
      const strokeDashoffset = -cumulativePercentage;
      cumulativePercentage += percentage;
      
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset
      };
    });
  }
</script>

{#if isOpen}
  <div class="visible modalbox" id="modalbox-statistics">
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/statistics.svg" alt="Statistics icon">
      <span class="modalbox-title">Statistics</span>
    </div>
    <div class="modalbox-content">
      <div class="chart-container">
        <h3>Item Distribution</h3>
        <div class="pie-chart">
          {#if itemTypeData.length > 0}
            {@const segments = calculatePieSegments()}
            {@const radius = 80}
            {@const centerX = 100}
            {@const centerY = 100}
            {@const strokeWidth = 40}
            <svg width="200" height="200" viewBox="0 0 200 200">
              {#each segments as segment, i}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  stroke-width={strokeWidth}
                  stroke-dasharray={segment.strokeDasharray}
                  stroke-dashoffset={segment.strokeDashoffset}
                  transform={`rotate(-90 ${centerX} ${centerY})`}
                />
              {/each}
              
              <!-- Center circle for donut effect -->
              <circle cx={centerX} cy={centerY} r={radius - strokeWidth/2} fill="white" />
            </svg>
            <div class="chart-legend">
              {#each itemTypeData as item}
                <div class="legend-item">
                  <div class="legend-color" style="background-color: {item.color};"></div>
                  <span>{item.name}: {item.count}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p>No data available</p>
          {/if}
        </div>
      </div>
      
      <div class="chart-container">
        <h3>Daily Activity</h3>
        <div class="bar-chart">
          {#if repetitionData.length > 0}
            {@const maxCount = getMaxRepetitionCount()}
            {@const chartHeight = 200}
            {@const chartWidth = 300}
            {@const barWidth = chartWidth / repetitionData.length - 10}
            <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {#each repetitionData as data, i}
                {@const barHeight = maxCount > 0 ? (data.count / maxCount) * (chartHeight - 40) : 0}
                {@const x = i * (chartWidth / repetitionData.length) + 10}
                {@const y = chartHeight - barHeight - 20}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#4e79a7"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 5}
                  text-anchor="middle"
                  font-size="10"
                  fill="currentColor"
                >
                  {data.date.split('-')[2]}
                </text>
                {#if barHeight > 15}
                  <text
                    x={x + barWidth / 2}
                    y={y + 15}
                    text-anchor="middle"
                    font-size="10"
                    fill="white"
                  >
                    {data.count}
                  </text>
                {/if}
              {/each}
            </svg>
          {:else}
            <p>No activity data available</p>
          {/if}
        </div>
      </div>
      
      <div class="chart-container">
        <h3>E-Factor Distribution</h3>
        <div class="bar-chart">
          {#if efactorData.length > 0}
            {@const maxEFactor = getMaxEFactor()}
            {@const chartHeight = 200}
            {@const chartWidth = 300}
            {@const barWidth = chartWidth / efactorData.length - 10}
            <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {#each efactorData as data, i}
                {@const barHeight = maxEFactor > 0 ? (data.efactor / maxEFactor) * (chartHeight - 40) : 0}
                {@const x = i * (chartWidth / efactorData.length) + 10}
                {@const y = chartHeight - barHeight - 20}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#e15759"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 5}
                  text-anchor="middle"
                  font-size="10"
                  fill="currentColor"
                >
                  {data.id.substring(0, 3)}
                </text>
              {/each}
            </svg>
          {:else}
            <p>No E-factor data available</p>
          {/if}
        </div>
      </div>
    </div>
    <button class="modalbox-button" on:click={closeStatistics} type="button">Close</button>
  </div>
{/if}

<style>
  .modalbox {
    position: absolute;
    overflow: scroll;
    background-color: rgb(var(--background-color_modalbox));
    color: rgb(var(--font-color));
    width: 400px;
    height: 600px;
    max-height: 800px;
    left: 50%;
    top: 50%;
    margin-left: -200px;
    margin-top: -300px;
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
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
  }

  .chart-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .chart-container h3 {
    margin-bottom: 10px;
    font-size: 18px;
  }

  .pie-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .chart-legend {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .bar-chart {
    display: flex;
    justify-content: center;
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