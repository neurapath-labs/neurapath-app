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
      <div class="flex items-center gap-3 mb-2">
        <BookOpenIcon class="w-10 h-10" />
        <h1 class="text-2xl font-semibold">Quick start ({currentStep}/{totalSteps})</h1>
      </div>
      <p class="text-sm italic opacity-80 mb-4">A few tips to get productive fast.</p>

      <!-- Body -->
      <div class="overflow-y-auto pr-1 text-base leading-relaxed prose prose-sm dark:prose-invert max-w-none">
        {#if currentStep === 1}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (1/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p>The left sidebar organizes your content and shows when your database was last saved. Quick actions give you fast access to Search, Settings, Import/Export, Item Explorer, Flagged Items and Statistics.</p>
            <p>Use the <b>Practice mode</b> button to start/stop learning. Your folders, extracts, clozes and occlusions are listed below. Right‑click anywhere in the sidebar to open a context menu for actions.</p>
          </div>
        {:else if currentStep === 2}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (2/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p>Toggle <b>Practice mode</b> in the sidebar to enter learning. Use <b>Space</b> to show the answer and grade with <b>1‑5</b> (1 = no recall, 5 = perfect). Think of the answer before revealing it for stronger memory.</p>
          </div>
        {:else if currentStep === 3}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (3/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Last saved</u> shows when your database was last synced. Changes are saved and the timestamp updates accordingly.</p>
            <p>Your data is sent securely. Images may be stored separately and are not linkable back to a database.</p>
          </div>
        {:else if currentStep === 4}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (4/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p>Use <u>Spotlight Search</u> (<b>Ctrl/Cmd + J</b>) to quickly find files and content, or type <b>&gt;</b> to run commands (e.g., open modals).</p>
          </div>
        {:else if currentStep === 5}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (5/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Main working window</u> is where you manage content. Paste formatted text and images here.</p>
            <p><u>Create extract</u>: select text then <b>Ctrl/Cmd + Shift + E</b>.</p>
            <p><u>Create cloze</u>: select text then <b>Ctrl/Cmd + Shift + C</b>.</p>
            <p><u>Create image occlusion</u>: open the occlusion tool with <b>Ctrl/Cmd + Shift + O</b>, then add masks.</p>
          </div>
        {:else if currentStep === 6}
          <div class="flex flex-col items-center gap-2 mb-4">
            <UserIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (6/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Settings</u> lets you configure the app and keyboard shortcuts:</p>
            <ul class="list-decimal list-inside space-y-1 text-sm">
              <li>AI settings: set your <b>OpenRouter API key</b> and choose a <b>model</b></li>
              <li>Customize <b>keyboard shortcuts</b> (auto‑saves)</li>
              <li>UI: font size, show/hide right sidebar, images</li>
              <li>Import/Export and public database options</li>
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
            <p><u>Import/Export</u> lets you back up or move your data. You can also make your database public in <b>Settings</b> to share with others.</p>
          </div>
        {:else if currentStep === 9}
          <div class="flex flex-col items-center gap-2 mb-4">
            <SearchIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (9/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><u>Item Explorer</u> helps locate problematic cards—high repetitions, low easiness factor. Open it from the sidebar to review and jump to items.</p>
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
            <p><u>Right sidebar</u> can show similar content, related words and Wikipedia summaries based on your selection. Toggle it in Settings.</p>
          </div>
        {:else if currentStep === 13}
          <div class="flex flex-col items-center gap-2 mb-4">
            <BookOpenIcon class="w-[72px] h-[72px]" />
            <span class="text-xl font-semibold whitespace-nowrap">Quick start (13/{totalSteps})</span>
          </div>
          <div class="leading-relaxed space-y-3 text-sm">
            <p><b>AI summarization</b>: select text → <b>Ctrl/Cmd + Shift + M</b>. Configure API key and model in Settings.</p>
            <p><b>Occlusion generation</b>: paste or drop an image, then use <b>Ctrl/Cmd + Shift + O</b> to add masks.</p>
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

