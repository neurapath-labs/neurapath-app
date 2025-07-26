<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { learning } from '$lib/stores/learning.store';
  import { database } from '$lib/stores/database.store';
  import { profile } from '$lib/stores/profile.store';
  import { modal } from '$lib/stores/modal.store';
  import type { Record, Profile } from '$lib/models';
  import { browser } from '$app/environment';

  let questionEditor: HTMLDivElement | null = $state(null);
  let answerEditor: HTMLDivElement | null = $state(null);
  let questionQuill: any | null = $state(null);
  let answerQuill: any | null = $state(null);
  let questionOcclusionCanvas: HTMLCanvasElement | null = $state(null);
  let answerOcclusionCanvas: HTMLCanvasElement | null = $state(null);
  let currentRecord: Record | null = $state(null);
  let showAnswer: boolean = $state(false);
  let profileData: Profile | null = $state(null);
  let dueItems: Record[] = $state([]);
  let currentIndex: number = $state(0);
  let sessionStats = $state({ reviewed: 0, total: 0 });

  // ------ Subscriptions ------
  $effect(() => {
    const unsub = learning.subscribe(($l) => {
      currentRecord = $l.currentRecord;
      if (currentRecord) {
        updateQuestionDisplay();
        showAnswer = false;
      }
    });
    return () => unsub();
  });

  $effect(() => {
    const unsub = profile.subscribe(($p) => (profileData = $p));
    return () => unsub();
  });

  $effect(() => {
    const unsub = database.subscribe(($db) => {
      const today = new Date();
      dueItems = $db.items
        .filter((it) => {
          if (!it.dueDate || it.repetition === undefined) return false;
          if (!profileData) return false;
          if (it.contentType === 'Cloze' && !profileData.showClozesInLearningMode) return false;
          if (it.contentType === 'Extract' && !profileData.showExtractsInLearningMode) return false;
          if (it.contentType === 'Occlusion' && !profileData.showOcclusionsInLearningMode) return false;
          return new Date(it.dueDate) <= today;
        })
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      sessionStats.total = dueItems.length;
      if (!currentRecord && dueItems.length) {
        learning.setCurrentRecord(dueItems[0]);
        currentIndex = 0;
      }
    });
    return () => unsub();
  });

  // ------ onMount: init Quill ------
  onMount(() => {
    if (browser) {
      import('quill').then((Q) => {
        import('quill/dist/quill.bubble.css');
        const Quill = Q.default;
        if (questionEditor) questionQuill = new Quill(questionEditor, { theme: 'bubble', readOnly: true, modules: { toolbar: false } });
        if (answerEditor) answerQuill = new Quill(answerEditor, { theme: 'bubble', readOnly: true, modules: { toolbar: false } });
      });
    }
    if (dueItems.length && !currentRecord) {
      learning.setCurrentRecord(dueItems[0]);
      currentIndex = 0;
    }
  });

  // ------ Helpers (update displays, occlusions, grading, etc.) ------
  function updateQuestionDisplay() {
    if (!currentRecord) return;
    if (currentRecord.contentType === 'Occlusion' && currentRecord.url) drawOcclusionQuestion();
    else if (currentRecord.contentType === 'Cloze' && currentRecord.content && questionQuill) {
      questionQuill.setContents(currentRecord.content);
      currentRecord.clozes?.forEach((c) => questionQuill!.formatText(c.startindex, c.stopindex - c.startindex, { background: '#000', color: '#000' }));
    } else if (currentRecord.content && questionQuill) questionQuill.setContents(currentRecord.content);
  }
  function updateAnswerDisplay() {
    if (!currentRecord) return;
    if (currentRecord.contentType === 'Occlusion' && currentRecord.url) drawOcclusionAnswer();
    else if (currentRecord.content && answerQuill) {
      answerQuill.setContents(currentRecord.content);
      if (currentRecord.contentType === 'Cloze') currentRecord.clozes?.forEach((c) => answerQuill!.formatText(c.startindex, c.stopindex - c.startindex, { background: '#73b9ff', color: '#000' }));
    }
  }
  function handleShowAnswer() {
    showAnswer = true;
    updateAnswerDisplay();
  }
  async function handleGrade(g: number) {
    if (!currentRecord) return;
    try {
      const r = learning.sm2(g, currentRecord.repetition || 0, currentRecord.efactor || 2.5, currentRecord.interval || 0);
      await database.updateRecordRemotely(currentRecord.id, {
        repetition: r.repetition,
        efactor: r.efactor,
        interval: r.interval,
        dueDate: r.dueDate,
        totalRepetitionCount: (currentRecord.totalRepetitionCount || 0) + 1
      });
      sessionStats.reviewed += 1;
      moveToNextItem();
      toast(`Item graded with ${g}/5`);
    } catch {
      toast('Error grading item');
    }
  }
  function moveToNextItem() {
    if (!dueItems.length) return (learning.setCurrentRecord(null));
    currentIndex = (currentIndex + 1) % dueItems.length;
    if (currentIndex < dueItems.length) learning.setCurrentRecord(dueItems[currentIndex]);
    else { learning.setCurrentRecord(null); toast('All items reviewed!'); }
    showAnswer = false;
  }
  async function toggleFlag() {
    if (!currentRecord) return;
    const isFlagged = !(currentRecord.isFlagged || false);
    await database.updateRecordRemotely(currentRecord.id, { isFlagged });
    toast(`Item ${isFlagged ? 'flagged' : 'unflagged'}`);
  }
  function drawOcclusionQuestion() {
    if (!questionOcclusionCanvas || !currentRecord?.url) return;
    const img = new Image();
    img.onload = () => {
      questionOcclusionCanvas!.width = img.naturalWidth; questionOcclusionCanvas!.height = img.naturalHeight;
      const ctx = questionOcclusionCanvas!.getContext('2d'); if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'black';
      currentRecord!.occlusions?.forEach((o) => ctx.fillRect(o.x, o.y, o.width, o.height));
    };
    img.src = currentRecord.url;
  }
  function drawOcclusionAnswer() {
    if (!answerOcclusionCanvas || !currentRecord?.url) return;
    const img = new Image();
    img.onload = () => {
      answerOcclusionCanvas!.width = img.naturalWidth; answerOcclusionCanvas!.height = img.naturalHeight;
      const ctx = answerOcclusionCanvas!.getContext('2d'); if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.strokeStyle = 'red'; ctx.lineWidth = 2;
      currentRecord!.occlusions?.forEach((o) => { ctx.fillRect(o.x, o.y, o.width, o.height); ctx.strokeRect(o.x, o.y, o.width, o.height); });
    };
    img.src = currentRecord.url;
  }
  function exitLearningMode() { learning.toggleLearningMode(); }
</script>

<div class="flex flex-col h-full p-5">
  {#if currentRecord}
    <!-- Header -->
    <div class="flex justify-between items-center mb-5">
      <div class="text-base font-bold">Reviewed: {sessionStats.reviewed}/{sessionStats.total}</div>
      <Button class="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700" onclick={exitLearningMode} variant="destructive" size="sm">Exit</Button>
    </div>

    <!-- Item Container -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <div class="text-sm text-gray-500 mb-2 flex items-center gap-2">
        {currentRecord.contentType}
        {#if currentRecord.isFlagged}<span class="bg-yellow-300 text-black px-2 rounded text-xs font-bold">FLAGGED</span>{/if}
      </div>

      <!-- Question -->
      <div class="mb-5 flex flex-col flex-1 overflow-hidden">
        <h3 class="text-lg mb-2">Question</h3>
        {#if currentRecord.contentType === 'Occlusion' && currentRecord.url}
          <div class="relative inline-block max-w-full">
            <img src={currentRecord.url} alt="Occlusion image" class="block max-w-full" on:load={handleOcclusionImageLoad} />
            <canvas bind:this={questionOcclusionCanvas} class="absolute inset-0 pointer-events-none"></canvas>
          </div>
        {:else}
          <div bind:this={questionEditor} class="flex-1 overflow-auto border rounded p-2 bg-gray-100"></div>
        {/if}
      </div>

      {#if showAnswer}
        <!-- Answer -->
        <div class="mb-5 flex flex-col flex-1 overflow-hidden">
          <h3 class="text-lg mb-2">Answer</h3>
          {#if currentRecord.contentType === 'Occlusion' && currentRecord.url}
            <div class="relative inline-block max-w-full">
              <img src={currentRecord.url} alt="Occlusion image" class="block max-w-full" />
              <canvas bind:this={answerOcclusionCanvas} class="absolute inset-0 pointer-events-none"></canvas>
            </div>
          {:else}
            <div bind:this={answerEditor} class="flex-1 overflow-auto border rounded p-2 bg-blue-50"></div>
          {/if}
        </div>

        <!-- Grading -->
        <div class="mt-5">
          <h3 class="text-lg text-center mb-4">How well did you know this?</h3>
          <div class="flex justify-center gap-2 flex-wrap">
            <Button class="grade-btn bg-red-600 text-white" onclick={() => handleGrade(1)}>1 - Didn't know</Button>
            <Button class="grade-btn bg-orange-500 text-white" onclick={() => handleGrade(2)}>2 - Hard</Button>
            <Button class="grade-btn bg-amber-400 text-black" onclick={() => handleGrade(3)}>3 - Medium</Button>
            <Button class="grade-btn bg-lime-600 text-white" onclick={() => handleGrade(4)}>4 - Easy</Button>
            <Button class="grade-btn bg-green-600 text-white" onclick={() => handleGrade(5)}>5 - Perfect</Button>
          </div>
        </div>
      {:else}
        <div class="flex justify-center mt-5">
          <Button class="px-6 py-3 bg-green-600 text-white rounded text-base hover:bg-green-700" onclick={handleShowAnswer} size="lg">Show Answer (Space)</Button>
        </div>
      {/if}
    </div>

    <!-- Footer actions -->
    <div class="flex justify-center gap-5 mt-5">
      <Button class="px-4 py-2 bg-blue-600 text-white rounded text-sm" onclick={toggleFlag}>{currentRecord.isFlagged ? 'Unflag Item (F)' : 'Flag Item (F)'}</Button>
      <Button class="px-4 py-2 bg-gray-500 text-white rounded text-sm" onclick={moveToNextItem} variant="secondary">Skip (S)</Button>
    </div>
  {:else}
    <!-- No items message -->
    <div class="flex flex-col items-center justify-center h-full text-center gap-4">
      <h2 class="text-2xl font-semibold">No items to review</h2>
      <p class="text-gray-500">You've completed all your reviews for now. Check back later for more items.</p>
      <Button class="px-4 py-2 bg-red-600 text-white rounded text-sm" onclick={exitLearningMode} variant="destructive" size="sm">Exit Learning Mode</Button>
    </div>
  {/if}
</div>

<style>
  /* Re‑use existing grade button utility class */
  .grade-btn{padding:10px 15px;border-radius:4px;font-size:14px;min-width:100px;}
</style>