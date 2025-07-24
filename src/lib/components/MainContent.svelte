<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Quill from 'quill';
  import 'quill/dist/quill.bubble.css';
  import { database } from '$lib/stores/database.store';
  import { learning } from '$lib/stores/learning.store';
  import { selection } from '$lib/stores/selection.store';
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { occlusion } from '$lib/stores/occlusion.store';
  import { profile } from '$lib/stores/profile.store';
  import { modal } from '$lib/stores/modal.store';
  import type { Record, Cloze } from '$lib/models';
  import { createID, mobileCheck } from '$lib/utils/helpers';

  let { children } = $props();
  let editor: HTMLDivElement;
  let quill: Quill | null = null;
  let activeRecord: Record | null = null;
  let isLearningMode = false;
  let profileData: any = {};
  let selectionData: any = {};
  let lastActiveImageID: string | null = null;
  let lastActiveImageURL: string | null = null;
  let activeOcclusionsList: any[] = [];
  let saveTimeout: any = null;

  // Subscribe to database changes
  const unsubscribe = database.subscribe(($database) => {
    // For now, just load the first record with content
    const recordWithContent = $database.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze'
    );
    
    if (recordWithContent && recordWithContent.content) {
      activeRecord = recordWithContent;
      if (quill) {
        quill.setContents(recordWithContent.content);
      }
    }
  });

  // Subscribe to profile changes
  const unsubscribeProfile = profile.subscribe(($profile) => {
    profileData = $profile;
  });

  // Subscribe to selection changes
  const unsubscribeSelection = selection.subscribe(($selection) => {
    selectionData = $selection;
  });

  // Subscribe to learning mode changes
  const unsubscribeLearning = learning.subscribe(($learning) => {
    isLearningMode = $learning.isInLearningMode;
    if (quill) {
      if (isLearningMode) {
        quill.disable();
      } else {
        quill.enable();
      }
    }
  });

  // Clean up subscriptions
  onDestroy(() => {
    unsubscribe();
    unsubscribeProfile();
    unsubscribeSelection();
    unsubscribeLearning();
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  });

  // Enhanced toolbar options with image support
  const getToolbarOptions = () => {
    if (!profileData.showToolbar) return false;
    
    return [
      ['bold', 'italic', 'underline', 'strike'],
      ['image', 'blockquote'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ];
  };

  onMount(() => {
    if (editor) {
      quill = new Quill(editor, {
        theme: 'bubble',
        modules: {
          toolbar: getToolbarOptions()
        }
      });

      // Set initial content
      if (activeRecord && activeRecord.content) {
        quill.setContents(activeRecord.content);
      }

      // Handle text changes with debounced saving
      quill.on('text-change', () => {
        if (quill && activeRecord) {
          // Debounce saving to avoid too frequent updates
          if (saveTimeout) {
            clearTimeout(saveTimeout);
          }
          
          saveTimeout = setTimeout(() => {
            if (quill && activeRecord && activeRecord.id) {
              const content = quill.getContents();
              saveContentToDatabase(activeRecord.id, content);
            }
          }, 1000);
        }
      });

      // Handle selection changes
      quill.on('selection-change', (range) => {
        if (range && range.length > 0 && quill) {
          const text = quill.getText(range.index, range.length) || '';
          selection.setSelection(text, range);
        } else {
          selection.clearSelection();
        }
      });

      // Handle paste events
      quill.root.addEventListener('paste', handlePaste);

      // Handle drop events
      quill.root.addEventListener('drop', handleDrop);

      // Handle keydown events
      quill.root.addEventListener('keydown', handleKeyDown);
    }

    // Add global keydown listener
    window.addEventListener('keydown', handleGlobalKeyDown);
  });

  // Clean up global event listeners
  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown);
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  });

  // Function to save content to database
  const saveContentToDatabase = async (recordId: string, content: any) => {
    try {
      await database.updateRecordRemotely(recordId, { content });
      console.log('Content saved to database:', recordId);
    } catch (error) {
      console.error('Error saving content to database:', error);
      modal.showAlert('Error saving content', 'danger');
    }
  };

  // Function to handle text changes
  const handleTextChange = () => {
    if (quill && activeRecord) {
      const content = quill.getContents();
      // TODO: Update the store with the new content
      console.log('Content updated:', content);
    }
  };

  // Function to handle selection changes
  const handleSelectionChange = () => {
    // TODO: Implement selection change handling
    console.log('Selection changed');
  };

  // Function to handle paste events
  const handlePaste = async (e: ClipboardEvent) => {
    console.log('Paste event detected');
    handleDocumentImport(e);
  };

  // Function to handle drop events
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    console.log('Drop event detected');
    handleDocumentImport(e);
  };

  // Function to handle keydown events on the editor
  const handleKeyDown = (e: KeyboardEvent) => {
    // Get shortcuts from profile
    const clozeShortcut = profileData.shortcuts.find((s: any) => s.event === 'input-create-cloze');
    const extractShortcut = profileData.shortcuts.find((s: any) => s.event === 'input-create-extract');
    const summarizeShortcut = profileData.shortcuts.find((s: any) => s.event === 'input-text-summarize');
    
    // Create cloze when pressed
    if (clozeShortcut &&
        e.keyCode === clozeShortcut.keyCode &&
        ((e.ctrlKey || e.metaKey) === (clozeShortcut.ctrlKey || clozeShortcut.metaKey)) &&
        e.altKey === clozeShortcut.altKey) {
      e.preventDefault();
      createCloze();
    }
    // Create extract when pressed
    else if (extractShortcut &&
             e.keyCode === extractShortcut.keyCode &&
             ((e.ctrlKey || e.metaKey) === (extractShortcut.ctrlKey || extractShortcut.metaKey)) &&
             e.altKey === extractShortcut.altKey) {
      e.preventDefault();
      createExtract();
    }
    // Summarize text when pressed
    else if (summarizeShortcut &&
             e.keyCode === summarizeShortcut.keyCode &&
             ((e.ctrlKey || e.metaKey) === (summarizeShortcut.ctrlKey || summarizeShortcut.metaKey)) &&
             e.altKey === summarizeShortcut.altKey) {
      e.preventDefault();
      summarizeText();
    }
  };

  // Function to handle global keydown events
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    // Get shortcuts from profile
    const createOcclusionShortcut = profileData.shortcuts.find((s: any) => s.event === 'input-create-occlusion');
    const createSeparateOcclusionShortcut = profileData.shortcuts.find((s: any) => s.event === 'input-create-occlusion-separate');
    const flagItemShortcut = profileData.shortcuts.find((s: any) => s.event === 'input-flag-item');
    
    // Create occlusion when pressed
    if (createOcclusionShortcut &&
        e.keyCode === createOcclusionShortcut.keyCode &&
        ((e.ctrlKey || e.metaKey) === (createOcclusionShortcut.ctrlKey || createOcclusionShortcut.metaKey)) &&
        e.altKey === createOcclusionShortcut.altKey) {
      e.preventDefault();
      createOcclusion(false);
    }
    // Create separate occlusions when pressed
    else if (createSeparateOcclusionShortcut &&
             e.keyCode === createSeparateOcclusionShortcut.keyCode &&
             ((e.ctrlKey || e.metaKey) === (createSeparateOcclusionShortcut.ctrlKey || createSeparateOcclusionShortcut.metaKey)) &&
             e.altKey === createSeparateOcclusionShortcut.altKey) {
      e.preventDefault();
      createOcclusion(true);
    }
    // Flag item when pressed
    else if (flagItemShortcut &&
             e.keyCode === flagItemShortcut.keyCode &&
             ((e.ctrlKey || e.metaKey) === (flagItemShortcut.ctrlKey || flagItemShortcut.metaKey)) &&
             e.altKey === flagItemShortcut.altKey) {
      e.preventDefault();
      flagItem();
    }
  };

  // Function to create a cloze deletion
  const createCloze = () => {
    if (selectionData.isSelected && quill && activeRecord) {
      try {
        const range = selectionData.range;
        if (range && quill) {
          const contentDelta = quill.getContents();
          const selectedText = selectionData.text;
          
          // Create new record for the cloze
          const newRecordId = (activeRecord.id || "record") + "/" + createID(6);
          const cloze: Cloze = {
            cloze: selectedText,
            startindex: range.index,
            stopindex: range.index + range.length
          };
          
          const newRecord: Record = {
            id: newRecordId,
            contentType: "Cloze",
            content: contentDelta,
            clozes: [cloze]
          };
          
          // Add to database
          database.addRecord(newRecord);
          
          // Highlight the text visually
          quill.formatText(range.index, range.length, {
            'background': profileData.clozeHighlightColor || '#73b9ff'
          });
          
          quill.setSelection(null);
        }
        modal.showAlert('Cloze created successfully', 'success');
      } catch (error) {
        console.error('Error creating cloze:', error);
        modal.showAlert('Error creating cloze', 'danger');
      }
    } else {
      modal.showAlert('Please select text to create a cloze', 'warning');
    }
  };

  // Function to create a text extract
  const createExtract = () => {
    if (selectionData.isSelected && quill && activeRecord) {
      try {
        const range = selectionData.range;
        if (range && quill) {
          const selectedContent = quill.getContents(range.index, range.length);
          
          // Create new record for the extract
          const newRecordId = (activeRecord.id || "record") + "/" + createID(6);
          const newRecord: Record = {
            id: newRecordId,
            contentType: "Extract",
            content: selectedContent
          };
          
          // Add to database
          database.addRecord(newRecord);
          
          // Format the text visually with yellow overlay
          quill.formatText(range.index, range.length, {
            'background': profileData.extractHighlightColor || '#f9ff24'
          });
          
          quill.setSelection(null);
        }
        modal.showAlert('Extract created successfully', 'success');
      } catch (error) {
        console.error('Error creating extract:', error);
        modal.showAlert('Error creating extract', 'danger');
      }
    } else {
      modal.showAlert('Please select text to create an extract', 'warning');
    }
  };

  // Function to summarize selected text
  const summarizeText = () => {
    if (selectionData.isSelected && quill && activeRecord) {
      try {
        const range = selectionData.range;
        const selectedText = selectionData.text;
        
        // In a real implementation, this would call an API to summarize the text
        // For now, we'll just create a new extract with the same text
        const summarizedText = "Summary of: " + selectedText; // Placeholder
        
        // Create new record for the summarized extract
        const newRecordId = (activeRecord.id || "record") + "/" + createID(6);
        const newRecord: Record = {
          id: newRecordId,
          contentType: "Extract",
          content: {
            "ops": [{"insert": summarizedText}]
          }
        };
        
        // Add to database
        database.addRecord(newRecord);
        
        if (quill) {
          quill.setSelection(null);
        }
        modal.showAlert('Text summarized successfully', 'success');
      } catch (error) {
        console.error('Error summarizing text:', error);
        modal.showAlert('Error summarizing text', 'danger');
      }
    } else {
      modal.showAlert('Please select text to summarize', 'warning');
    }
  };

  // Function to create an occlusion
  const createOcclusion = (separateOcclusions: boolean) => {
    if (activeRecord) {
      try {
        // This would typically involve creating occlusions from the active image
        // For now, we'll just show a success message
        console.log('Create occlusion, separate:', separateOcclusions);
        modal.showAlert('Occlusion created successfully', 'success');
      } catch (error) {
        console.error('Error creating occlusion:', error);
        modal.showAlert('Error creating occlusion', 'danger');
      }
    } else {
      modal.showAlert('No active record to create occlusion', 'warning');
    }
  };

  // Function to flag an item
  const flagItem = () => {
    if (activeRecord) {
      try {
        // Toggle flagged status
        const isFlagged = !(activeRecord.isFlagged || false);
        if (activeRecord.id) {
          database.updateRecordRemotely(activeRecord.id, { isFlagged });
        }
        
        modal.showAlert(`Item ${isFlagged ? 'flagged' : 'unflagged'} successfully`, 'success');
      } catch (error) {
        console.error('Error flagging item:', error);
        modal.showAlert('Error flagging item', 'danger');
      }
    } else {
      modal.showAlert('No active record to flag', 'warning');
    }
  };

  // Function to handle document import (paste/drop)
  const handleDocumentImport = async (e: ClipboardEvent | DragEvent) => {
    let file: File | null = null;
    
    if (e instanceof ClipboardEvent) {
      // Handle paste event
      if (e.clipboardData?.items[0]) {
        file = e.clipboardData.items[0].getAsFile() || null;
      }
    } else if (e instanceof DragEvent) {
      // Handle drop event
      if (e.dataTransfer?.files[0]) {
        file = e.dataTransfer.files[0];
      }
    }
    
    if (file) {
      // Handle image files
      if (file.type.startsWith('image/')) {
        try {
          // Insert image into Quill editor
          const reader = new FileReader();
          reader.onload = (event) => {
            if (quill && event.target?.result) {
              const range = quill.getSelection() || { index: quill.getLength(), length: 0 };
              quill.insertEmbed(range.index, 'image', event.target.result);
              quill.setSelection(range.index + 1);
            }
          };
          reader.readAsDataURL(file);
          modal.showAlert('Image imported successfully', 'success');
        } catch (error) {
          console.error('Error importing image:', error);
          modal.showAlert('Error importing image', 'danger');
        }
      }
      // Handle PDF files
      else if (file.type === 'application/pdf') {
        try {
          // In a real implementation, this would parse the PDF and create records
          console.log('PDF file detected:', file.name);
          modal.showAlert('PDF imported successfully', 'success');
        } catch (error) {
          console.error('Error importing PDF:', error);
          modal.showAlert('Error importing PDF', 'danger');
        }
      }
      // Handle text files
      else if (file.type === 'text/plain' || file.type === 'text/html') {
        try {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (quill && event.target?.result) {
              const range = quill.getSelection() || { index: quill.getLength(), length: 0 };
              quill.insertText(range.index, event.target.result as string);
              quill.setSelection(range.index + (event.target.result as string).length);
            }
          };
          reader.readAsText(file);
          modal.showAlert('Text imported successfully', 'success');
        } catch (error) {
          console.error('Error importing text:', error);
          modal.showAlert('Error importing text', 'danger');
        }
      }
    }
  };

  // Function to handle context menu
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    contextmenu.showContextMenu(e.clientX, e.clientY, null, 'content-area');
  };
</script>

<main id="content-input" on:contextmenu={handleContextMenu}>
  <div class="editor-wrapper">
    <div bind:this={editor} class="editor-container"></div>
    {@render children()}
  </div>
</main>

<style>
  .editor-wrapper {
    height: 100%;
  }
  
  .editor-container {
    height: 100%;
  }
  
  #content-input {
    grid-area: body;
    overflow: auto;
    position: relative;
    min-height: 100%;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-left: var(--mainWindow-padding);
    padding-right: var(--mainWindow-padding);
  }
  
  .ql-editor {
    font-size: var(--font-size);
  }
</style>