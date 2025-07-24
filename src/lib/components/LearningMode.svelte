<script lang="ts">
  import { onMount } from 'svelte';
  import { learning } from '$lib/stores/learning.store';
  import { database } from '$lib/stores/database.store';
  import { profile } from '$lib/stores/profile.store';
  import { modal } from '$lib/stores/modal.store';
  import type { Record, Profile } from '$lib/models';
  import Quill from 'quill';
  import 'quill/dist/quill.bubble.css';

  let questionEditor: HTMLDivElement | null = $state(null);
  let answerEditor: HTMLDivElement | null = $state(null);
  let questionQuill: Quill | null = $state(null);
  let answerQuill: Quill | null = $state(null);
  let questionOcclusionCanvas: HTMLCanvasElement | null = $state(null);
  let answerOcclusionCanvas: HTMLCanvasElement | null = $state(null);
  let currentRecord: Record | null = $state(null);
  let showAnswer: boolean = $state(false);
  let profileData: Profile | null = $state(null);
  let dueItems: Record[] = $state([]);
  let currentIndex: number = $state(0);
  let sessionStats = $state({
    reviewed: 0,
    total: 0
  });

  // Subscribe to learning store
  $effect(() => {
    const unsubscribe = learning.subscribe(($learning) => {
      currentRecord = $learning.currentRecord;
      if (currentRecord) {
        updateQuestionDisplay();
        showAnswer = false;
      }
    });
    
    return () => unsubscribe();
  });

  // Subscribe to profile changes
  $effect(() => {
    const unsubscribe = profile.subscribe(($profile) => {
      profileData = $profile;
    });
    
    return () => unsubscribe();
  });

  // Subscribe to database changes to get due items
  $effect(() => {
    const unsubscribe = database.subscribe(($database) => {
      // Filter items that are due for review (dueDate <= today)
      const today = new Date();
      const filteredItems = $database.items.filter((item) => {
        // Only include items with spaced repetition data
        if (!item.dueDate || item.repetition === undefined) return false;
        
        // Check if item type is enabled for learning mode
        if (!profileData) return false;
        if (item.contentType === 'Cloze' && !profileData.showClozesInLearningMode) return false;
        if (item.contentType === 'Extract' && !profileData.showExtractsInLearningMode) return false;
        if (item.contentType === 'Occlusion' && !profileData.showOcclusionsInLearningMode) return false;
        
        // Check if item is due
        const dueDate = new Date(item.dueDate);
        return dueDate <= today;
      }).sort((a, b) => {
        // Sort by due date (oldest first)
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
      });
      
      dueItems = filteredItems;
      sessionStats.total = dueItems.length;
      
      // If we don't have a current record, set the first due item
      if (!currentRecord && dueItems.length > 0) {
        learning.setCurrentRecord(dueItems[0]);
        currentIndex = 0;
      }
    });
    
    return () => unsubscribe();
  });

  onMount(() => {
    // Initialize Quill editors
    if (questionEditor) {
      questionQuill = new Quill(questionEditor, {
        theme: 'bubble',
        readOnly: true,
        modules: {
          toolbar: false
        }
      });
    }
    
    if (answerEditor) {
      answerQuill = new Quill(answerEditor, {
        theme: 'bubble',
        readOnly: true,
        modules: {
          toolbar: false
        }
      });
    }
    
    // Add keyboard event listener
    // window.addEventListener('keydown', handleKeyDown); // Handled by keyboard.service.ts
    
    // Load first due item if available
    if (dueItems.length > 0 && !currentRecord) {
      learning.setCurrentRecord(dueItems[0]);
      currentIndex = 0;
    }
    
    // Cleanup function
    return () => {
      // window.removeEventListener('keydown', handleKeyDown); // Handled by keyboard.service.ts
    };
  });

  // Update question display when current record changes
  function updateQuestionDisplay() {
    if (currentRecord) {
      // For occlusions, draw the image with occlusions hidden
      if (currentRecord.contentType === 'Occlusion' && currentRecord.url && currentRecord.occlusions) {
        drawOcclusionQuestion();
      }
      // For clozes, we need to show the text with clozes hidden
      else if (currentRecord.contentType === 'Cloze' && currentRecord.content && currentRecord.clozes) {
        if (questionQuill) {
          questionQuill.setContents(currentRecord.content);
          
          // Hide clozed text
          currentRecord.clozes.forEach((cloze) => {
            questionQuill!.formatText(cloze.startindex, cloze.stopindex - cloze.startindex, {
              'background': '#000000',
              'color': '#000000'
            });
          });
        }
      }
      // For extracts and other content types, show as is
      else if (currentRecord.content && questionQuill) {
        questionQuill.setContents(currentRecord.content);
      }
    }
  }

  // Update answer display
  function updateAnswerDisplay() {
    if (currentRecord) {
      // For occlusions, draw the image with occlusions revealed
      if (currentRecord.contentType === 'Occlusion' && currentRecord.url && currentRecord.occlusions) {
        drawOcclusionAnswer();
      }
      // For clozes, show the clozed text
      else if (currentRecord.contentType === 'Cloze' && currentRecord.clozes) {
        if (currentRecord.content && answerQuill) {
          answerQuill.setContents(currentRecord.content);
        }
        
        // Highlight clozed text
        currentRecord.clozes.forEach((cloze) => {
          if (answerQuill) {
            answerQuill!.formatText(cloze.startindex, cloze.stopindex - cloze.startindex, {
              'background': '#73b9ff',
              'color': '#000000'
            });
          }
        });
      }
      // For other content types, show the same content
      else if (currentRecord.content && answerQuill) {
        answerQuill.setContents(currentRecord.content);
      }
    }
  }

  // Show the answer
  function handleShowAnswer() {
    showAnswer = true;
    updateAnswerDisplay();
  }

  // Handle grading of an item (1-5 scale)
  async function handleGrade(grade: number) {
    if (!currentRecord) return;
    
    try {
      // Apply SM-2 algorithm
      const result = learning.sm2(
        grade,
        currentRecord.repetition || 0,
        currentRecord.efactor || 2.5,
        currentRecord.interval || 0
      );
      
      // Update the record in the database
      await database.updateRecordRemotely(currentRecord.id, {
        repetition: result.repetition,
        efactor: result.efactor,
        interval: result.interval,
        dueDate: result.dueDate,
        totalRepetitionCount: (currentRecord.totalRepetitionCount || 0) + 1
      });
      
      // Update session stats
      sessionStats.reviewed += 1;
      
      // Move to next item
      moveToNextItem();
      
      modal.showAlert(`Item graded with ${grade}/5`, 'success');
    } catch (error) {
      console.error('Error grading item:', error);
      modal.showAlert('Error grading item', 'danger');
    }
  }

  // Move to the next item in the queue
  function moveToNextItem() {
    if (dueItems.length > 0) {
      currentIndex = (currentIndex + 1) % dueItems.length;
      if (currentIndex < dueItems.length) {
        learning.setCurrentRecord(dueItems[currentIndex]);
      } else {
        // If we've reviewed all items, show completion message
        learning.setCurrentRecord(null);
        modal.showAlert('All items reviewed!', 'success');
      }
    } else {
      learning.setCurrentRecord(null);
    }
    
    // Reset UI state
    showAnswer = false;
  }

  // Toggle flag status of current item
  async function toggleFlag() {
    if (!currentRecord) return;
    
    try {
      const isFlagged = !(currentRecord.isFlagged || false);
      await database.updateRecordRemotely(currentRecord.id, { isFlagged });
      modal.showAlert(`Item ${isFlagged ? 'flagged' : 'unflagged'} successfully`, 'success');
    } catch (error) {
      console.error('Error flagging item:', error);
      modal.showAlert('Error flagging item', 'danger');
    }
  }

  // Handle keyboard shortcuts - now handled by global keyboard service
  // This function is kept for learning mode specific shortcuts that need context
  function handleKeyDown(e: KeyboardEvent) {
    // This function is no longer used as keyboard handling is done globally
    // but kept for reference if needed in the future
  }

  // Function to handle occlusion image loading
  function handleOcclusionImageLoad() {
    drawOcclusionQuestion();
  }

  // Function to draw occlusion question (hidden occlusions)
  function drawOcclusionQuestion() {
    if (!questionOcclusionCanvas || !currentRecord || currentRecord.contentType !== 'Occlusion' || !currentRecord.url || !currentRecord.occlusions) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image
      if (questionOcclusionCanvas) {
        questionOcclusionCanvas.width = img.naturalWidth;
        questionOcclusionCanvas.height = img.naturalHeight;
        
        const ctx = questionOcclusionCanvas.getContext('2d');
        if (!ctx) return;
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Draw occlusions (hidden - black rectangles)
        ctx.fillStyle = 'black';
        if (currentRecord && currentRecord.occlusions) {
          currentRecord.occlusions.forEach((occlusion) => {
            ctx.fillRect(occlusion.x, occlusion.y, occlusion.width, occlusion.height);
          });
        }
      }
    };
    img.src = currentRecord.url;
  }

  // Function to draw occlusion answer (revealed occlusions)
  function drawOcclusionAnswer() {
    if (!answerOcclusionCanvas || !currentRecord || currentRecord.contentType !== 'Occlusion' || !currentRecord.url || !currentRecord.occlusions) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image
      if (answerOcclusionCanvas) {
        answerOcclusionCanvas.width = img.naturalWidth;
        answerOcclusionCanvas.height = img.naturalHeight;
        
        const ctx = answerOcclusionCanvas.getContext('2d');
        if (!ctx) return;
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Draw occlusions (revealed - semi-transparent rectangles)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        if (currentRecord && currentRecord.occlusions) {
          currentRecord.occlusions.forEach((occlusion) => {
            ctx.fillRect(occlusion.x, occlusion.y, occlusion.width, occlusion.height);
            ctx.strokeRect(occlusion.x, occlusion.y, occlusion.width, occlusion.height);
          });
        }
      }
    };
    img.src = currentRecord.url;
  }

  // Exit learning mode
  function exitLearningMode() {
    learning.toggleLearningMode();
  }
</script>

<div class="learning-mode-container">
  {#if currentRecord}
    <div class="learning-header">
      <div class="session-stats">
        Reviewed: {sessionStats.reviewed}/{sessionStats.total}
      </div>
      <button class="exit-button" on:click={exitLearningMode}>Exit</button>
    </div>
    
    <div class="item-container">
      <div class="item-type">
        {currentRecord.contentType}
        {#if currentRecord.isFlagged}
          <span class="flagged-indicator">FLAGGED</span>
        {/if}
      </div>
      
      <div class="question-section">
        <h3>Question</h3>
        {#if currentRecord.contentType === 'Occlusion' && currentRecord.url}
          <div class="occlusion-container">
            <img
              src={currentRecord.url}
              alt="Occlusion image"
              class="occlusion-image"
              on:load={handleOcclusionImageLoad}
            />
            <canvas
              bind:this={questionOcclusionCanvas}
              class="occlusion-canvas"
            ></canvas>
          </div>
        {:else}
          <div bind:this={questionEditor} class="editor question-editor"></div>
        {/if}
      </div>
      
      {#if showAnswer}
        <div class="answer-section">
          <h3>Answer</h3>
          {#if currentRecord.contentType === 'Occlusion' && currentRecord.url}
            <div class="occlusion-container">
              <img
                src={currentRecord.url}
                alt="Occlusion image"
                class="occlusion-image"
              />
              <canvas
                bind:this={answerOcclusionCanvas}
                class="occlusion-canvas"
              ></canvas>
            </div>
          {:else}
            <div bind:this={answerEditor} class="editor answer-editor"></div>
          {/if}
        </div>
        
        <div class="grading-section">
          <h3>How well did you know this?</h3>
          <div class="grade-buttons">
            <button class="grade-btn grade-1" on:click={() => handleGrade(1)}>1 - Didn't know</button>
            <button class="grade-btn grade-2" on:click={() => handleGrade(2)}>2 - Hard</button>
            <button class="grade-btn grade-3" on:click={() => handleGrade(3)}>3 - Medium</button>
            <button class="grade-btn grade-4" on:click={() => handleGrade(4)}>4 - Easy</button>
            <button class="grade-btn grade-5" on:click={() => handleGrade(5)}>5 - Perfect</button>
          </div>
        </div>
      {:else}
        <div class="show-answer-section">
          <button class="show-answer-btn" on:click={handleShowAnswer}>Show Answer (Space)</button>
        </div>
      {/if}
    </div>
    
    <div class="learning-actions">
      <button class="action-btn flag-btn" on:click={toggleFlag}>
        {#if currentRecord && currentRecord.isFlagged}
          Unflag Item (F)
        {:else}
          Flag Item (F)
        {/if}
      </button>
      <button class="action-btn skip-btn" on:click={moveToNextItem}>Skip (S)</button>
    </div>
  {:else}
    <div class="no-items-message">
      <h2>No items to review</h2>
      <p>You've completed all your reviews for now. Check back later for more items.</p>
      <button class="exit-button" on:click={exitLearningMode}>Exit Learning Mode</button>
    </div>
  {/if}
</div>

<style>
  .learning-mode-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
  }
  
  .learning-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .session-stats {
    font-size: 16px;
    font-weight: bold;
  }
  
  .exit-button {
    padding: 8px 16px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .exit-button:hover {
    background-color: #d32f2f;
  }
  
  .item-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .item-type {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .flagged-indicator {
    background-color: #ffeb3b;
    color: #000;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }
  
  .question-section, .answer-section {
    margin-bottom: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .question-section h3, .answer-section h3 {
    margin: 0 0 10px 0;
    font-size: 18px;
  }
  
  .editor {
    flex: 1;
    overflow: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
  }
  
  .question-editor {
    background-color: #f9f9f9;
  }
  
  .answer-editor {
    background-color: #f0f8ff;
  }
  
  .show-answer-section {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
  
  .show-answer-btn {
    padding: 12px 24px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
  
  .show-answer-btn:hover {
    background-color: #45a049;
  }
  
  .grading-section {
    margin-top: 20px;
  }
  
  .grading-section h3 {
    margin: 0 0 15px 0;
    text-align: center;
    font-size: 18px;
  }
  
  .grade-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .grade-btn {
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    min-width: 100px;
  }
  
  .grade-1 { background-color: #f44336; color: white; }
  .grade-2 { background-color: #ff9800; color: white; }
  .grade-3 { background-color: #ffc107; color: black; }
  .grade-4 { background-color: #8bc34a; color: white; }
  .grade-5 { background-color: #4caf50; color: white; }
  
  .grade-btn:hover {
    opacity: 0.9;
  }
  
  .learning-actions {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
  }
  
  .action-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .flag-btn {
    background-color: #2196f3;
    color: white;
  }
  
  .skip-btn {
    background-color: #9e9e9e;
    color: white;
  }
  
  .action-btn:hover {
    opacity: 0.9;
  }
  
  .no-items-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
  }
  
  .no-items-message h2 {
    margin-bottom: 10px;
  }
  
  .no-items-message p {
    margin-bottom: 20px;
    color: #666;
  }
  
  .occlusion-container {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }
  
  .occlusion-image {
    display: block;
    max-width: 100%;
    height: auto;
  }
  
  .occlusion-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
</style>