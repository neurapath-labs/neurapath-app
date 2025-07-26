<script lang="ts">
  import { ui } from '$lib/stores/ui.store';
  import { onMount, onDestroy } from 'svelte';

  let isOpen: boolean = $state(false);
  let currentStep: number = $state(1);
  let totalSteps: number = $state(14);

  let unsubscribeUI: (() => void) | undefined;

  onMount(() => {
    unsubscribeUI = ui.subscribe(($ui) => {
      isOpen = $ui.isTutorialOpen;
    });
  });

  onDestroy(() => {
    unsubscribeUI?.();
  });

  function nextStep() {
    if (currentStep < totalSteps) currentStep += 1;
  }
  function previousStep() {
    if (currentStep > 1) currentStep -= 1;
  }
  function completeTutorial() {
    ui.closeTutorial();
  }
  function closeTutorial() {
    ui.closeTutorial();
  }
</script>

{#if isOpen}
  <div id="modalbox-tutorial" class="fixed inset-0 flex items-center justify-center z-10">
    <div class="relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] w-[400px] h-[400px] max-h-[600px] p-8 border border-[rgb(var(--background-color))] rounded overflow-y-auto grid grid-rows-[auto_1fr_auto] gap-6">
      <!-- Dynamic Content -->
      <div>
        {#if currentStep === 1}
          <div class="flex flex-col items-center gap-2 mb-4">
            <img src="/img/tutorial.svg" alt="Tutorial icon" class="w-[72px]" />
            <span class="text-2xl font-semibold whitespace-nowrap">Quick start (1/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p>The left sidebar is used to organize your content. Here you will see when the database was last saved to the cloud and how many items are due today. Here you will also find the engage button used for learning the material in your database.</p>
            <p>Below the engage button all your folders, clozes, images and image occlusions will show. You can right‑click in this sidebar to open a menu to handle the items.</p>
          </div>
        {:else if currentStep === 2}
          <Step title={`Quick start (2/${totalSteps})`} img="/img/tutorial.svg">
            <p>Press here to start learning your material then use <b>Space</b> to show the answer. Grade with <b>Ctrl + 1‑5</b> (default). Ctrl + 1 = no clue; Ctrl + 5 = perfect recall. Think of the answer before showing it for better learning.</p>
          </Step>
        {:else if currentStep === 3}
          <Step title={`Quick start (3/${totalSteps})`} img="/img/tutorial.svg">
            <p><u>Last saved</u> tells you when your database was saved to the cloud. Your encrypted database is uploaded every 15 seconds.</p>
            <p>(The DB is AES‑256 encrypted before upload. Images are unencrypted but cannot be linked back to a DB.)</p>
          </Step>
        {:else if currentStep === 4}
          <Step title={`Quick start (4/${totalSteps})`} img="/img/tutorial.svg">
            <p><u>Due today</u> shows how many items need review. neurapath uses the SM‑2 algorithm (like Anki) to optimize spaced repetition.</p>
          </Step>
        {:else if currentStep === 5}
          <Step title={`Quick start (5/${totalSteps})`} img="/img/tutorial.svg">
            <p><u>Main working window</u> is where you manage content. Paste formatted text and images here.</p><p><u>Create extract</u>: select text then Ctrl + X.</p><p><u>Create cloze</u>: select text then Ctrl + C.</p><p><u>Create image occlusion</u>: drop an image then draw boxes and press Ctrl + Z.</p>
          </Step>
        {:else if currentStep === 6}
          <Step title={`Quick start (6/${totalSteps})`} img="/img/user.svg">
            <p><u>Settings</u> lets you configure shortcuts and UI in Profile:</p>
            <ul class="list-decimal list-inside space-y-1 text-sm">
              <li>Working window text size</li>
              <li>Toggle extracts, occlusions, clozes in learning</li>
              <li>Show/hide images & right sidebar</li>
              <li>Share / export / import DB</li>
              <li>Import Anki / Quizlet (experimental)</li>
            </ul>
          </Step>
        {:else if currentStep === 7}
          <Step title={`Quick start (7/${totalSteps})`} img="/img/night-mode.svg">
            <p><u>Dark mode</u> is great for your eyes.</p>
          </Step>
        {:else if currentStep === 8}
          <Step title={`Quick start (8/${totalSteps})`} img="/img/database.svg">
            <p><u>Public databases</u> let you share. Make your DB public in settings, then friends can import it using your password.</p>
          </Step>
        {:else if currentStep === 9}
          <Step title={`Quick start (9/${totalSteps})`} img="/img/find.svg">
            <p><u>Item finder</u> helps locate problematic cards—high repetitions, low easiness. Edit or delete them to improve learning.</p>
          </Step>
        {:else if currentStep === 10}
          <Step title={`Quick start (10/${totalSteps})`} img="/img/unflag.svg">
            <p><u>Flagged items</u> lets you mark cards during learning with Ctrl + F and revisit them later.</p>
          </Step>
        {:else if currentStep === 11}
          <Step title={`Quick start (11/${totalSteps})`} img="/img/statistics.svg">
            <p><u>Statistics</u> shows review history and new‑item counts.</p>
          </Step>
        {:else if currentStep === 12}
          <Step title={`Quick start (12/${totalSteps})`} img="/img/tutorial.svg">
            <p><u>Right sidebar</u> offers quick Wikipedia lookup for selected words. Import articles with right‑click → Import.</p>
          </Step>
        {:else if currentStep === 13}
          <Step title={`Quick start (13/${totalSteps})`} img="/img/sine.svg">
            <p><b>AI text summarization</b>: select text → Ctrl + F.</p><p><b>Occlusion generation</b>: paste or drop images, then Ctrl + Z.</p>
          </Step>
        {:else if currentStep === 14}
          <Step title={`Quick start (14/${totalSteps})`} img="/img/trophy.svg">
            <p><u>Well done!</u> Join our Discord: <a href="https://discord.gg/QKVf38QfCc" class="underline" target="_blank" rel="noopener noreferrer">discord.gg/QKVf38QfCc</a> or email <a href="mailto:hi@neurapath.io" class="underline">hi@neurapath.io</a>.</p>
          </Step>
        {/if}
      </div>

      <!-- Buttons -->
      <div class="flex justify-between gap-2">
        {#if currentStep === totalSteps}
          <button type="button" on:click={completeTutorial} class="flex-1 px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] text-sm">Complete tutorial!</button>
        {:else}
          <button type="button" on:click={nextStep} class="flex-1 px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] text-sm">Next</button>
        {/if}
        {#if currentStep > 1}
          <button type="button" on:click={previousStep} class="flex-1 px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))] text-sm">Previous</button>
        {/if}
        {#if currentStep < totalSteps}
          <button type="button" on:click={closeTutorial} class="flex-1 px-4 py-2 rounded border border-[rgb(var(--background-color))] bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm">Skip tutorial</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Step component -->
<script context="module" lang="ts">
  export function Step({ title, img, $$slots }: { title: string; img: string; $$slots: any }) {
    return (
      <div>
        <div class="flex flex-col items-center gap-2 mb-4">
          <img src={img} alt="icon" class="w-[72px]" />
          <span class="text-2xl font-semibold whitespace-nowrap">{title}</span>
        </div>
        <div class="leading-relaxed space-y-3 text-sm">{$$slots.default()}</div>
      </div>
    );
  }
</script>