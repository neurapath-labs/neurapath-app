<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import { ui } from '$lib/stores/ui.store';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import UserIcon from '@lucide/svelte/icons/user';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import DatabaseIcon from '@lucide/svelte/icons/database';
  import SearchIcon from '@lucide/svelte/icons/search';
  import FlagOffIcon from '@lucide/svelte/icons/flag-off';
  import BarChartIcon from '@lucide/svelte/icons/bar-chart';
  import TrophyIcon from '@lucide/svelte/icons/trophy';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';

  // Svelte 5 runes
  let isOpen: boolean = $state(false);
  let currentStep: number = $state(1);
  let totalSteps: number = $state(14);

  // Subscribe to UI store for open state
  $effect(() => {
    const unsub = ui.subscribe(($ui) => {
      isOpen = $ui.isTutorialOpen;
    });
    return () => unsub();
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
  function handleOpenChange(openState: boolean) {
    if (!openState) ui.closeTutorial();
  }
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-50" />

    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
             w-[90vw] max-w-[650px] max-h-[90vh]
             grid grid-rows-[auto_1fr_auto] overflow-hidden
             rounded-lg border border-[rgb(var(--background-color))]
             bg-[rgb(var(--background-color_modalbox))]
             text-[rgb(var(--font-color))] p-8 shadow-lg focus:outline-none z-50"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <BookOpenIcon class="w-10 h-10" />
        <h1 class="text-2xl font-semibold">Quick start ({currentStep}/{totalSteps})</h1>
      </div>

      <!-- Body -->
      <div class="overflow-y-auto pr-1">
        {#if currentStep === 1}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (1/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p>The left sidebar is used to organize your content. Here you will see when the database was last saved to the cloud and how many items are due today. Here you will also find the engage button used for learning the material in your database.</p>
            <p>Below the engage button all your folders, clozes, images and image occlusions will show. You can right‑click in this sidebar to open a menu to handle the items.</p>
          </div>
        {:else if currentStep === 2}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (2/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p>Press here to start learning your material then use <b>Space</b> to show the answer. Grade with <b>Ctrl + 1‑5</b> (default). Ctrl + 1 = no clue; Ctrl + 5 = perfect recall. Think of the answer before showing it for better learning.</p>
          </div>
        {:else if currentStep === 3}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (3/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Last saved</u> tells you when your database was saved to the cloud. Your encrypted database is uploaded every 15 seconds.</p>
            <p>(The DB is AES‑256 encrypted before upload. Images are unencrypted but cannot be linked back to a DB.)</p>
          </div>
        {:else if currentStep === 4}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (4/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Due today</u> shows how many items need review. neurapath uses the SM‑2 algorithm (like Anki) to optimize spaced repetition.</p>
          </div>
        {:else if currentStep === 5}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (5/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Main working window</u> is where you manage content. Paste formatted text and images here.</p>
            <p><u>Create extract</u>: select text then Ctrl + X.</p>
            <p><u>Create cloze</u>: select text then Ctrl + C.</p>
            <p><u>Create image occlusion</u>: drop an image then draw boxes and press Ctrl + Z.</p>
          </div>
        {:else if currentStep === 6}
          <div class="flex flex-col items-center gap-2 mb-4">
            <UserIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (6/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Settings</u> lets you configure shortcuts and UI in Profile:</p>
            <ul class="list-decimal list-inside space-y-1 text-sm">
              <li>Working window text size</li>
              <li>Toggle extracts, occlusions, clozes in learning</li>
              <li>Show/hide images & right sidebar</li>
              <li>Share / export / import DB</li>
              <li>Import Anki / Quizlet (experimental)</li>
            </ul>
          </div>
        {:else if currentStep === 7}
          <div class="flex flex-col items-center gap-2 mb-4">
            <MoonIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (7/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Dark mode</u> is great for your eyes.</p>
          </div>
        {:else if currentStep === 8}
          <div class="flex flex-col items-center gap-2 mb-4">
            <DatabaseIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (8/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Public databases</u> let you share. Make your DB public in settings, then friends can import it using your password.</p>
          </div>
        {:else if currentStep === 9}
          <div class="flex flex-col items-center gap-2 mb-4">
            <SearchIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (9/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Item finder</u> helps locate problematic cards—high repetitions, low easiness. Edit or delete them to improve learning.</p>
          </div>
        {:else if currentStep === 10}
          <div class="flex flex-col items-center gap-2 mb-4">
            <FlagOffIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (10/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Flagged items</u> lets you mark cards during learning with Ctrl + F and revisit them later.</p>
          </div>
        {:else if currentStep === 11}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BarChartIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (11/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Statistics</u> shows review history and new‑item counts.</p>
          </div>
        {:else if currentStep === 12}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (12/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Right sidebar</u> offers quick Wikipedia lookup for selected words. Import articles with right‑click → Import.</p>
          </div>
        {:else if currentStep === 13}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (13/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><b>AI text summarization</b>: select text → Ctrl + F.</p>
            <p><b>Occlusion generation</b>: paste or drop images, then Ctrl + Z.</p>
          </div>
        {:else if currentStep === 14}
          <div class="flex flex-col items-center gap-2 mb-4">
            <TrophyIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (14/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Well done!</u> Join our Discord: <a href="https://discord.gg/QKVf38QfCc" class="underline" target="_blank" rel="noopener noreferrer">discord.gg/QKVf38QfCc</a> or email <a href="mailto:hi@neurapath.shop" class="underline">hi@neurapath.shop</a>.</p>
          </div>
        {/if}
      </div>

      <!-- Footer actions -->
      <div class="mt-6 flex justify-end gap-2">
        {#if currentStep > 1}
          <Button type="button" onclick={previousStep} class="cursor-pointer" variant="outline" size="sm">
            <ChevronLeftIcon class="mr-2 size-4" />
            Previous
          </Button>
        {/if}
        {#if currentStep === totalSteps}
          <Button type="button" onclick={completeTutorial} class="cursor-pointer" variant="outline" size="sm">
            <CheckCircleIcon class="mr-2 size-4" />
            Complete tutorial!
          </Button>
        {:else}
          <Button type="button" onclick={nextStep} class="cursor-pointer" variant="outline" size="sm">
            Next
            <ChevronRightIcon class="ml-2 size-4" />
          </Button>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

