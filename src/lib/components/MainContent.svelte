<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { database } from '$lib/stores/database.store';
  import { learning } from '$lib/stores/learning.store';
  import { selection } from '$lib/stores/selection.store';
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { occlusion } from '$lib/stores/occlusion.store';
  import { profile } from '$lib/stores/profile.store';
  import { ui } from '$lib/stores/ui.store';
  import { toast } from "svelte-sonner";
  import type { Record, Cloze } from '$lib/models';
  import { createID, mobileCheck } from '$lib/utils/helpers';
  import LearningMode from '$lib/components/LearningMode.svelte';

  let { children } = $props();
  let editor: HTMLDivElement | null = $state(null);
  let quill: any = $state(null);
  let activeRecord: Record | null = $state(null);
  let isLearningMode = $state(false);
  let profileData: any = {};
  let selectionData: any = {};
  let lastActiveImageID: string | null = null;
  let lastActiveImageURL: string | null = null;
  let activeOcclusionsList: any[] = [];
  let saveTimeout: any = null;
  let activeItemId: string | null = $state(null);
  let currentDatabase: any = $state(null);

  // Subscribe to database changes
  const unsubscribe = database.subscribe(($database) => {
    currentDatabase = $database;
    
    // Use setTimeout to ensure the database update happens after the database state update
    setTimeout(() => {
      
      updateActiveRecord($database);
    }, 0);
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
    const wasLearningMode = isLearningMode;
    isLearningMode = $learning.isInLearningMode;
    
    if (quill) {
      if (isLearningMode) {
        quill.disable();
      } else {
        quill.enable();
        // Update content when exiting learning mode
        if (activeRecord && activeRecord.content) {
          
          updateQuillContent(activeRecord);
        }
      }
    }
    // If we just exited learning mode, trigger UI update
    if (wasLearningMode && !isLearningMode) {
      
      // Use setTimeout to ensure the UI update happens after the learning mode update
      setTimeout(() => {
        if (activeItemId) {
          // Re-trigger the UI update to ensure the active item is properly loaded
          
          updateActiveRecordWithCurrentDatabase();
        }
      }, 0);
    }
  });

  // Subscribe to UI changes (active item)
  const unsubscribeUI = ui.subscribe(($ui) => {
    const previousActiveItemId = activeItemId;
    activeItemId = $ui.activeItemId;
    
    
    // Trigger update of active record with current database state
    // Use setTimeout to ensure the UI update happens after the active item ID update
    setTimeout(() => {
      
      updateActiveRecordWithCurrentDatabase();
    }, 0);
  });

  // Clean up subscriptions
  onDestroy(() => {
    unsubscribe();
    unsubscribeProfile();
    unsubscribeSelection();
    unsubscribeLearning();
    unsubscribeUI();
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

  onMount(async () => {
    if (editor && browser) {
      
      const { default: Quill } = await import('quill');
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
          }, 5000);
        }
      });

      // Handle selection changes
      quill.on('selection-change', (range: any) => {
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
    // window.addEventListener('keydown', handleGlobalKeyDown); // Handled by keyboard.service.ts
  });


  // Function to save content to database
  const saveContentToDatabase = async (recordId: string, content: any) => {
    try {
      await database.updateRecordRemotely(recordId, { content });
      
    } catch (error) {
      console.error('Error saving content to database:', error);
      toast('Error saving content');
    }
  };

  // Function to handle text changes
  const handleTextChange = () => {
    if (quill && activeRecord) {
      const content = quill.getContents();
      // TODO: Update the store with the new content
      
    }
  };

  // Function to handle selection changes
  const handleSelectionChange = () => {
    // TODO: Implement selection change handling
    ('Selection changed');
  };

  // Function to handle paste events
  const handlePaste = async (e: ClipboardEvent) => {
    ('Paste event detected');
    handleDocumentImport(e);
  };

  // Function to update active record based on active item ID
  function updateActiveRecord($database: any) {
    
    
    // Find the active record based on the active item ID
    if (activeItemId) {
      const record = $database.items.find((item: Record) => item.id === activeItemId);
      
      if (record) {
        activeRecord = record;
        // Only update Quill content if we're not in learning mode
        if (!isLearningMode) {
          
          updateQuillContent(record);
        } else {
          
        }
      }
    } else {
      // For now, just load the first record with content if no active item
      const recordWithContent = $database.items.find((item: Record) =>
        item.contentType === 'Extract' || item.contentType === 'Cloze'
      );
      
      if (recordWithContent && recordWithContent.content) {
        activeRecord = recordWithContent;
        // Only update Quill content if we're not in learning mode
        if (!isLearningMode) {
          
          updateQuillContent(recordWithContent);
        } else {
          
        }
      }
    }
  }
  
  // Function to update active record with current database state
  function updateActiveRecordWithCurrentDatabase() {
    // If we have current database state, use it
    if (currentDatabase) {
      updateActiveRecord(currentDatabase);
    } else {
      // Otherwise, get the current database state directly
      database.subscribe(($database) => {
        updateActiveRecord($database);
      })();
    }
  }


  // Function to handle drop events
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    ('Drop event detected');
    handleDocumentImport(e);
  };

  // Function to update Quill content
  const updateQuillContent = (record: Record) => {
    
    
    if (quill && record.content) {
      
      
      // Convert string content to Delta format if needed
      const content = typeof record.content === 'string'
        ? { ops: [{ insert: record.content }] }
        : record.content;
      // Clear existing content first
      quill.setContents({ ops: [] });
      // Set new content
      quill.setContents(content);
      
    } else {
      
    }
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


  // Function to create a cloze deletion
  const createCloze = async () => {
    (selectionData.isSelected, quill, activeRecord);
    
    if (selectionData.isSelected && quill && activeRecord) {
      try {
        const range = selectionData.range;
        if (range && quill) {
          const contentDelta = quill.getContents();
          const selectedText = selectionData.text;
          
          // Create new record for the cloze
          const parentId = activeRecord.id || "record";
          const newRecordId = parentId + "/" + createID(6);
          const cloze: Cloze = {
            cloze: selectedText,
            startindex: range.index,
            stopindex: range.index + range.length
          };
          
          const newRecord: Record = {
            id: newRecordId,
            contentType: "Cloze",
            content: contentDelta,
            clozes: [cloze],
            // Initialize with SM-2 algorithm properties for immediate review
            repetition: 0,
            interval: 0,
            efactor: 2.5,
            dueDate: new Date().toISOString(),
            priority: 1,
            totalRepetitionCount: 0
          };
          
          // Add to database
          await database.addRecord(newRecord);
          
          // If the parent is an Extract, add this cloze to its clozes array
          if (activeRecord.contentType === 'Extract' && activeRecord.id) {
            const updatedClozes = [...(activeRecord.clozes || []), cloze];
            await database.updateRecordRemotely(activeRecord.id, { clozes: updatedClozes });
          }
          
          // Expand all parent folders to show the new item
          ui.expandAllParentsToId(newRecordId);
          
          // Highlight the text visually
          quill.formatText(range.index, range.length, {
            'background': profileData.clozeHighlightColor || '#73b9ff'
          });
          
          quill.setSelection(null);
        }
        toast('Cloze created successfully');
      } catch (error) {
        console.error('Error creating cloze:', error);
        toast('Error creating cloze');
      }
    } else {
      toast('Please select text to create a cloze');
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
          const parentId = activeRecord.id || "record";
          const newRecordId = parentId + "/" + createID(6);
          const newRecord: Record = {
            id: newRecordId,
            contentType: "Extract",
            content: selectedContent,
            // Initialize with SM-2 algorithm properties for immediate review
            repetition: 0,
            interval: 0,
            efactor: 2.5,
            dueDate: new Date().toISOString(),
            priority: 1,
            totalRepetitionCount: 0
          };
          
          // Add to database
          database.addRecord(newRecord);
          
          // Expand all parent folders to show the new item
          ui.expandAllParentsToId(newRecordId);
          
          // Format the text visually with yellow overlay
          quill.formatText(range.index, range.length, {
            'background': profileData.extractHighlightColor || '#f9ff24'
          });
          
          quill.setSelection(null);
        }
        toast('Extract created successfully');
      } catch (error) {
        console.error('Error creating extract:', error);
        toast('Error creating extract');
      }
    } else {
      toast('Please select text to create an extract');
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
        const parentId = activeRecord.id || "record";
        const newRecordId = parentId + "/" + createID(6);
        const newRecord: Record = {
          id: newRecordId,
          contentType: "Extract",
          content: {
            "ops": [{"insert": summarizedText}]
          },
          // Initialize with SM-2 algorithm properties for immediate review
          repetition: 0,
          interval: 0,
          efactor: 2.5,
          dueDate: new Date().toISOString(),
          priority: 1,
          totalRepetitionCount: 0
        };
        
        // Add to database
        database.addRecord(newRecord);
        
        // Expand all parent folders to show the new item
        ui.expandAllParentsToId(newRecordId);
        
        if (quill) {
          quill.setSelection(null);
        }
        toast('Text summarized successfully');
      } catch (error) {
        console.error('Error summarizing text:', error);
        toast('Error summarizing text');
      }
    } else {
      toast('Please select text to summarize');
    }
  };

  // Function to create an occlusion
  const createOcclusion = (separateOcclusions: boolean) => {
    if (activeRecord) {
      try {
        // This would typically involve creating occlusions from the active image
        // For now, we'll just show a success message
        
        toast('Occlusion created successfully');
      } catch (error) {
        console.error('Error creating occlusion:', error);
        toast('Error creating occlusion');
      }
    } else {
      toast('No active record to create occlusion');
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
        
        toast(`Item ${isFlagged ? 'flagged' : 'unflagged'} successfully`);
      } catch (error) {
        console.error('Error flagging item:', error);
        toast('Error flagging item');
      }
    } else {
      toast('No active record to flag');
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
          toast('Image imported successfully');
        } catch (error) {
          console.error('Error importing image:', error);
          toast('Error importing image');
        }
      }
      // Handle PDF files
      else if (file.type === 'application/pdf') {
        try {
          // In a real implementation, this would parse the PDF and create records
          
          toast('PDF imported successfully');
        } catch (error) {
          console.error('Error importing PDF:', error);
          toast('Error importing PDF');
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
          toast('Text imported successfully');
        } catch (error) {
          console.error('Error importing text:', error);
          toast('Error importing text');
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

<main
  id="content-input"
  class="[grid-area:body] overflow-auto relative min-h-full w-full h-full box-border pt-2 pb-2 pl-[var(--mainWindow-padding)] pr-[var(--mainWindow-padding)]"
  oncontextmenu={handleContextMenu}
>
  {#if isLearningMode}
    <LearningMode />
  {:else}
    <div class="h-full">
      <div bind:this={editor} class="h-full"></div>
      <!-- Display clozes associated with the active extract -->
      {#if activeRecord && activeRecord.contentType === 'Extract' && activeRecord.clozes && activeRecord.clozes.length > 0}
        <div class="mt-4">
          <h3 class="font-bold mb-2">Clozes in this extract:</h3>
          <ul class="list-disc pl-5">
            {#each activeRecord.clozes as cloze}
              <li class="mb-1">{cloze.cloze}</li>
            {/each}
          </ul>
        </div>
      {/if}
      {@render children()}
    </div>
  {/if}
</main>
