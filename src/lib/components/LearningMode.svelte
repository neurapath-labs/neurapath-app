<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { learning } from '$lib/stores/learning.store';
  import { database } from '$lib/stores/database.store';
  import { profile } from '$lib/stores/profile.store';
  import type { Record, Profile } from '$lib/models';
  import { toast } from "svelte-sonner";
  import { browser } from '$app/environment';

  let questionEditor: HTMLDivElement | null = $state(null);
  let questionQuill: any | null = $state(null);
  let questionOcclusionCanvas: HTMLCanvasElement | null = $state(null);
  let currentRecord: Record | null = $state(null);
  let showAnswer: boolean = $state(false);
  let profileData: Profile | null = $state(null);
  let dueItems: Record[] = $state([]);
  let currentIndex: number = $state(0);
  let sessionStats = $state({ reviewed: 0, total: 0 });
  let currentDatabase: any = $state(null);
  let questionOverlays: HTMLDivElement[] = $state([]);

  // ------ Subscriptions ------
  $effect(() => {
    const unsub = learning.subscribe(($l) => {
      // Update if the record ID has changed or if the record content has changed
      if ($l.currentRecord?.id !== currentRecord?.id || 
          JSON.stringify($l.currentRecord) !== JSON.stringify(currentRecord)) {
        currentRecord = $l.currentRecord;
        if (currentRecord) {
          // Use setTimeout to ensure DOM is updated before trying to access elements
          setTimeout(() => {
            updateQuestionDisplay();
            showAnswer = false;
          }, 0);
        }
      }
    });
    return () => unsub();
  });

  $effect(() => {
    const unsub = profile.subscribe(($p) => {
      
      // Only update if profile has actually changed
      if (JSON.stringify($p) !== JSON.stringify(profileData)) {
        profileData = $p;
        
      }
    });
    return () => unsub();
  });

  $effect(() => {
    const unsub = database.subscribe(($db) => {
      
      currentDatabase = $db;
      const today = new Date();
      const newDueItems = $db.items
        .filter((it: Record) => {
          
          if (!it.dueDate || it.repetition === undefined) {
            
            return false;
          }
          if (!profileData) {
            
            return false;
          }
          if (it.contentType === 'Cloze' && !profileData.showClozesInLearningMode) {
            
            return false;
          }
          if (it.contentType === 'Extract' && !profileData.showExtractsInLearningMode) {
            
            return false;
          }
          if (it.contentType === 'Occlusion' && !profileData.showOcclusionsInLearningMode) {
            
            return false;
          }
          const isDue = new Date(it.dueDate) <= today;
          
          return isDue;
        })
        .sort((a: Record, b: Record) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      
      // Only update if due items have actually changed
      if (JSON.stringify(newDueItems) !== JSON.stringify(dueItems)) {
        
        dueItems = newDueItems;
        sessionStats.total = dueItems.length;
        
        if (!currentRecord && dueItems.length > 0) {
          
          learning.setCurrentRecord(dueItems[0]);
          currentIndex = 0;
        } else if (!dueItems.length) {
          // No due items, clear current record
          
          learning.setCurrentRecord(null);
        }
      }
      
      // Update current record if it exists in the database and has changed
      if (currentRecord && currentRecord.id) {
        const recordId = currentRecord.id;
        const updatedRecord = $db.items.find(item => item.id === recordId);
        if (updatedRecord && JSON.stringify(updatedRecord) !== JSON.stringify(currentRecord)) {
          learning.setCurrentRecord(updatedRecord);
        }
      }
    });
    return () => unsub();
  });

  // ------ onMount: init Quill ------
  onMount(async () => {
    if (browser) {
      try {
        const Q = await import('quill');
        await import('quill/dist/quill.bubble.css');
        const Quill = Q.default;
        if (questionEditor) questionQuill = new Quill(questionEditor, { theme: 'bubble', readOnly: true, modules: { toolbar: false } });
        // Attach learning-mode hotkeys
        window.addEventListener('keydown', handleLearningKeydown);
      } catch (error) {
        console.error('Failed to initialize Quill:', error);
      }
    }
  });

  // ------ Helpers (update displays, occlusions, grading, etc.) ------
  function updateQuestionDisplay() {
    if (!currentRecord) return;
    if (currentRecord.contentType === 'Occlusion' && currentRecord.url) drawOcclusionQuestion();
    else if (currentRecord.contentType === 'Cloze' && currentRecord.content && questionQuill) {
      // Reset contents and overlays
      questionQuill.setContents(currentRecord.content);
      clearQuestionOverlays();
      currentRecord.clozes?.forEach((c) => questionQuill!.formatText(c.startindex, c.stopindex - c.startindex, { background: '#000', color: '#000' }));
      // Create interactive overlays for hidden words
      createClozeOverlays();
    } else if (currentRecord.content && questionQuill) questionQuill.setContents(currentRecord.content);
  }
  function updateAnswerDisplay() {
    if (!currentRecord) return;
    if (currentRecord.contentType === 'Occlusion' && currentRecord.url) drawOcclusionAnswer();
    else if (currentRecord.content && questionQuill) {
      // Reuse the same Quill editor for showing the answer (revealed cloze)
      questionQuill.setContents(currentRecord.content);
      if (currentRecord.contentType === 'Cloze') currentRecord.clozes?.forEach((c) => questionQuill!.formatText(c.startindex, c.stopindex - c.startindex, { background: '#73b9ff', color: '#000' }));
    }
  }
  function handleShowAnswer() {
    showAnswer = true;
    // Remove question overlays when revealing the answer
    clearQuestionOverlays();
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
      // Use setTimeout to prevent blocking the UI
      setTimeout(() => {
        moveToNextItem();
      }, 0);
      toast.success(`Item graded with ${g}/5`);
    } catch {
      toast.error('Error grading item');
    }
  }
  function moveToNextItem() {
    if (!dueItems.length) return (learning.setCurrentRecord(null));
    currentIndex = (currentIndex + 1) % dueItems.length;
    if (currentIndex < dueItems.length && dueItems[currentIndex]?.id !== currentRecord?.id) {
      learning.setCurrentRecord(dueItems[currentIndex]);
    } else if (currentIndex >= dueItems.length) {
      learning.setCurrentRecord(null);
      toast.info('All items reviewed!');
    }
    showAnswer = false;
  }
  async function toggleFlag() {
    if (!currentRecord) return;
    const isFlagged = !(currentRecord.isFlagged || false);
    
    await database.updateRecordRemotely(currentRecord.id, { isFlagged });
    
    // Get the updated record from the database to ensure UI reflects the change
    const updatedRecord = database.getRecordById(currentRecord.id);
    
    if (updatedRecord) {
      // Update the current record in the learning store to reflect the change
      learning.setCurrentRecord(updatedRecord);
    }
    
    toast.success(`Item ${isFlagged ? 'flagged' : 'unflagged'}`);
  }
  function drawOcclusionQuestion() {
    if (!questionOcclusionCanvas || !currentRecord?.url) return;
    const img = new Image();
    img.onload = () => {
      try {
        questionOcclusionCanvas!.width = img.naturalWidth; questionOcclusionCanvas!.height = img.naturalHeight;
        const ctx = questionOcclusionCanvas!.getContext('2d'); if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = 'black';
        currentRecord!.occlusions?.forEach((o) => ctx.fillRect(o.x, o.y, o.width, o.height));
      } catch (error) {
        console.error('Error drawing occlusion question:', error);
      }
    };
    img.onerror = (error) => {
      console.error('Error loading occlusion image:', error);
    };
    img.src = currentRecord.url;
  }
  function handleOcclusionImageLoad() {
    // This function is called when the occlusion image is loaded
    // We can trigger the drawing of the occlusion question here
    if (currentRecord?.contentType === 'Occlusion') {
      drawOcclusionQuestion();
    }
  }
  function drawOcclusionAnswer() {
    if (!questionOcclusionCanvas || !currentRecord?.url) return;
    const img = new Image();
    img.onload = () => {
      try {
        questionOcclusionCanvas!.width = img.naturalWidth; questionOcclusionCanvas!.height = img.naturalHeight;
        const ctx = questionOcclusionCanvas!.getContext('2d'); if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.strokeStyle = 'red'; ctx.lineWidth = 2;
        currentRecord!.occlusions?.forEach((o) => { ctx.fillRect(o.x, o.y, o.width, o.height); ctx.strokeRect(o.x, o.y, o.width, o.height); });
      } catch (error) {
        console.error('Error drawing occlusion answer:', error);
      }
    };
    img.onerror = (error) => {
      console.error('Error loading occlusion image:', error);
    };
    img.src = currentRecord.url;
  }
  function exitLearningMode() { learning.toggleLearningMode(); }
  onDestroy(() => {
    clearQuestionOverlays();
    if (browser) {
      window.removeEventListener('keydown', handleLearningKeydown);
    }
  });

  // ------ Keyboard shortcuts (learning mode) ------
  function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    if (!tag) return false;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if ((el as HTMLElement).isContentEditable) return true;
    return false;
  }

  function handleLearningKeydown(e: KeyboardEvent) {
    // Avoid interfering with typing in inputs
    if (isTypingTarget(e.target)) return;

    // Show answer on Space
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (!showAnswer) handleShowAnswer();
      return;
    }

    // Grade 1-5
    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      const grade = Number(e.key);
      if (!showAnswer) {
        // First reveal the answer, then allow immediate grading on next keypress
        handleShowAnswer();
        return;
      }
      handleGrade(grade);
      return;
    }

    // Flag toggle (F)
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFlag();
      return;
    }

    // Skip (S)
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      moveToNextItem();
      return;
    }
  }

  function clearQuestionOverlays() {
    try {
      questionOverlays.forEach((el) => el.remove());
    } catch {}
    questionOverlays = [];
  }

  function createClozeOverlays() {
    if (!questionQuill || !currentRecord?.clozes?.length) return;
    const editorRoot = (questionEditor?.querySelector('.ql-editor') as HTMLElement) || questionEditor;
    if (!editorRoot) return;
    // Ensure positioning context
    try { (editorRoot as HTMLElement).style.position = (getComputedStyle(editorRoot).position === 'static') ? 'relative' : getComputedStyle(editorRoot).position; } catch {}

    currentRecord.clozes!.forEach((c) => {
      const length = Math.max(0, (c.stopindex || 0) - (c.startindex || 0));
      if (length <= 0) return;
      let bounds: any;
      try {
        bounds = questionQuill!.getBounds(c.startindex, length);
      } catch {
        return;
      }
      if (!bounds) return;

      const overlay = document.createElement('div');
      overlay.className = 'cloze-overlay';
      overlay.style.position = 'absolute';
      overlay.style.left = `${bounds.left}px`;
      overlay.style.top = `${bounds.top}px`;
      overlay.style.width = `${bounds.width}px`;
      overlay.style.height = `${bounds.height}px`;
      overlay.style.cursor = 'help';
      overlay.style.background = 'transparent';
      overlay.style.zIndex = '5';

      // Tooltip element
      const tooltip = document.createElement('div');
      tooltip.textContent = c.cloze || '';
      tooltip.style.position = 'absolute';
      tooltip.style.left = '0px';
      tooltip.style.top = `${bounds.height + 6}px`;
      tooltip.style.maxWidth = '320px';
      tooltip.style.padding = '6px 8px';
      tooltip.style.borderRadius = '6px';
      tooltip.style.background = 'rgba(17,17,17,0.95)';
      tooltip.style.color = '#fff';
      tooltip.style.fontSize = '12px';
      tooltip.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.whiteSpace = 'pre-wrap';
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
      tooltip.style.transition = 'opacity 120ms ease';

      const show = () => { tooltip.style.opacity = '1'; tooltip.style.visibility = 'visible'; };
      const hide = () => { tooltip.style.opacity = '0'; tooltip.style.visibility = 'hidden'; };
      overlay.addEventListener('mouseenter', show);
      overlay.addEventListener('mouseleave', hide);
      overlay.addEventListener('click', () => {
        // Toggle on click (useful on touch devices)
        if (tooltip.style.visibility === 'visible') hide(); else show();
      });

      overlay.appendChild(tooltip);
      editorRoot.appendChild(overlay);
      questionOverlays.push(overlay);
    });
  }
</script>

<div class="flex flex-col h-full p-5 bg-[rgb(var(--background-color))] text-[rgb(var(--font-color))]">
  {#if currentRecord}
    <!-- Header -->
    <div class="flex justify-between items-center mb-5">
      <div class="text-base font-bold">Reviewed: {sessionStats.reviewed}/{sessionStats.total}</div>
      <Button class="px-4 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 border border-[rgb(var(--background-color))]" onclick={exitLearningMode} variant="destructive" size="sm">Exit</Button>
    </div>

    <!-- Item Container -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <div class="text-sm mb-2 flex items-center gap-2 opacity-80">
        {currentRecord.contentType}
        {#if currentRecord.isFlagged}<span class="bg-yellow-300 text-black px-2 rounded text-xs font-bold">FLAGGED</span>{/if}
      </div>

      <!-- Question / Answer (single box) -->
      <div class="mb-5 flex flex-col flex-1 overflow-hidden bg-[rgb(var(--background-color_sidebar))] rounded border border-[rgb(var(--background-color))] p-3">
        <h3 class="text-lg mb-2">{showAnswer ? 'Answer' : 'Question'}</h3>
        {#if currentRecord.contentType === 'Occlusion' && currentRecord.url}
          <div class="relative inline-block max-w-full">
            <img src={currentRecord.url} alt="Occlusion" class="block max-w-full" onload={handleOcclusionImageLoad} />
            <canvas bind:this={questionOcclusionCanvas} class="absolute inset-0 pointer-events-none"></canvas>
          </div>
        {:else}
          <div bind:this={questionEditor} class="flex-1 overflow-auto border rounded p-2 relative bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] border-[rgb(var(--background-color))]"></div>
        {/if}
      </div>

      {#if showAnswer}
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
          <Button
            onclick={handleShowAnswer}
            size="lg"
            class="px-6 py-3 rounded text-base border bg-[rgb(var(--background-color_sidebar))] text-[rgb(var(--font-color))] border-[rgb(var(--background-color))] hover:bg-[rgba(var(--background-color_button),0.12)] hover:text-[rgb(var(--font-color))] transition-colors"
          >
            Show Answer (Space)
          </Button>
        </div>
      {/if}
    </div>

    <!-- Footer actions -->
    <div class="flex justify-center gap-5 mt-5">
      <Button class="px-4 py-2 rounded text-sm bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgb(var(--background-color_button-hover))] border border-[rgb(var(--background-color))]" onclick={toggleFlag}>{currentRecord.isFlagged ? 'Unflag Item (F)' : 'Flag Item (F)'}</Button>
      <Button class="px-4 py-2 rounded text-sm bg-[rgba(var(--background-color),0.2)] text-[rgb(var(--font-color))] hover:bg-[rgba(var(--background-color),0.3)] border border-[rgb(var(--background-color))]" onclick={moveToNextItem} variant="secondary">Skip (S)</Button>
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