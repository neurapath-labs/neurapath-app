<script>
  import { onMount, onDestroy } from 'svelte';
  import { learning } from '$lib/stores/learning.store';
  import { database } from '$lib/stores/database.store';
  import { profile } from '$lib/stores/profile.store';
  import { modal } from '$lib/stores/modal.store';
  import Quill from 'quill';
  import 'quill/dist/quill.bubble.css';

  let questionEditor;
  let answerEditor;
  let questionQuill = null;
  let answerQuill = null;
  let currentRecord = null;
  let showAnswer = false;
  let profileData = {};
  let dueItems = [];
  let currentIndex = 0;
  let sessionStats = {
    reviewed: 0,
    total: 0
  };

  // Subscribe to learning store
  const unsubscribeLearning = learning.subscribe(($learning) => {
    currentRecord = $learning.currentRecord;
    if (currentRecord) {
      updateQuestionDisplay();
      showAnswer = false;
    }
  });

  // Subscribe to profile changes
  const unsubscribeProfile = profile.subscribe(($profile) => {
    profileData = $profile;
  });

  // Subscribe to database changes to get due items
  const unsubscribeDatabase = database.subscribe(($database) => {
    // Filter items that are due for review (dueDate <= today)
    const today = new Date();
    dueItems = $database.items.filter((item) => {
      // Only include items with spaced repetition data
      if (!item.dueDate || item.repetition === undefined) return false;
      
      // Check if item type is enabled for learning mode
      if (item.contentType === 'Cloze' && !profileData.showClozesInLearningMode) return false;
      if (item.contentType === 'Extract' && !profileData.showExtractsInLearningMode) return false;
      if (item.contentType === 'Occlusion' && !profileData.showOcclusionsInLearningMode) return false;
      
      // Check if item is due
      const dueDate = new Date(item.dueDate);
      return dueDate <= today;
    }).sort((a, b) => {
      // Sort by due date (oldest first)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    sessionStats.total = dueItems.length;
    
    // If we don't have a current record, set the first due item
    if (!currentRecord && dueItems.length > 0) {
      learning.setCurrentRecord(dueItems[0]);
      currentIndex = 0;
    }
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
    window.addEventListener('keydown', handleKeyDown);
    
    // Load first due item if available
    if (dueItems.length > 0 && !currentRecord) {
      learning.setCurrentRecord(dueItems[0]);
      currentIndex = 0;
    }
  });

  onDestroy(() => {
    if (unsubscribeLearning) unsubscribeLearning();
    if (unsubscribeProfile) unsubscribeProfile();
    if (unsubscribeDatabase) unsubscribeDatabase();
    window.removeEventListener('keydown', handleKeyDown);
  });

  // Update question display when current record changes
  function updateQuestionDisplay() {
    if (questionQuill && currentRecord) {
      // For clozes, we need to show the text with clozes hidden
      if (currentRecord.contentType === 'Cloze' && currentRecord.content && currentRecord.clozes) {
        questionQuill.setContents(currentRecord.content);
        
        // Hide clozed text
        currentRecord.clozes.forEach((cloze) => {
          questionQuill.formatText(cloze.startindex, cloze.stopindex - cloze.startindex, {
            'background': '#000000',
            'color': '#000000'
          });
        });
      } 
      // For extracts and other content types, show as is
      else if (currentRecord.content) {
        questionQuill.setContents(currentRecord.content);
      }
    }
  }

  // Update answer display
  function updateAnswerDisplay() {
    if (answerQuill && currentRecord) {
      // For clozes, show the clozed text
      if (currentRecord.contentType === 'Cloze' && currentRecord.clozes) {
        if (currentRecord.content) {
          answerQuill.setContents(currentRecord.content);
        }
        
        // Highlight clozed text
        currentRecord.clozes.forEach((cloze) => {
          answerQuill.formatText(cloze.startindex, cloze.stopindex - cloze.startindex, {
            'background': '#73b9ff',
            'color': '#000000'
          });
        });
      } 
      // For other content types, show the same content
      else if (currentRecord.content) {
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
  async function handleGrade(grade) {
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

  // Handle keyboard shortcuts
  function handleKeyDown(e) {
    // Only handle shortcuts if in learning mode
    if (!currentRecord) return;
    
    // Get shortcuts from profile
    const shortcuts = profileData.shortcuts || [];
    const showAnswerShortcut = shortcuts.find((s) => s.event === 'learning-show-answer');
    const flagItemShortcut = shortcuts.find((s) => s.event === 'learning-flag-item');
    
    // Show answer shortcut (default: Space)
    if (showAnswerShortcut &&
        e.keyCode === showAnswerShortcut.keyCode &&
        ((e.ctrlKey || e.metaKey) === (showAnswerShortcut.ctrlKey || showAnswerShortcut.metaKey)) &&
        e.altKey === showAnswerShortcut.altKey &&
        e.shiftKey === (showAnswerShortcut.shift || false)) {
      e.preventDefault();
      if (!showAnswer) {
        handleShowAnswer();
      }
    }
    // Flag item shortcut (default: F)
    else if (flagItemShortcut &&
             e.keyCode === flagItemShortcut.keyCode &&
             ((e.ctrlKey || e.metaKey) === (flagItemShortcut.ctrlKey || flagItemShortcut.metaKey)) &&
             e.altKey === flagItemShortcut.altKey &&
             e.shiftKey === (flagItemShortcut.shift || false)) {
      e.preventDefault();
      toggleFlag();
    }
    // Grade shortcuts (1-5 keys)
    else if (e.keyCode >= 49 && e.keyCode <= 53 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (showAnswer) {
        const grade = e.keyCode - 48; // Convert key code to grade (1-5)
        handleGrade(grade);
      }
    }
    // Skip item (S key)
    else if (e.keyCode === 83 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      moveToNextItem();
    }
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
        <div bind:this={questionEditor} class="editor question-editor"></div>
      </div>
      
      {#if showAnswer}
        <div class="answer-section">
          <h3>Answer</h3>
          <div bind:this={answerEditor} class="editor answer-editor"></div>
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
</style>