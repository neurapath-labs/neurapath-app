<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { browser } from '$app/environment';
  import { database } from '$lib/stores/database.store';
  import { learning } from '$lib/stores/learning.store';
  import { selection } from '$lib/stores/selection.store';
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { occlusion } from '$lib/stores/occlusion.store';
  import { profile } from '$lib/stores/profile.store';
  import { ui } from '$lib/stores/ui.store';
  import { modal } from '$lib/stores/modal.store';
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
  let cleanupClozeTimeout: any = null;
  let activeItemId: string | null = $state(null);
  let currentDatabase: any = $state(null);
  
  // Global keyboard listener for spotlight search
  let globalKeyBuffer = $state('');
  let globalKeyTimeout: any = null;

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

  // Subscribe to UI changes (active item and search term)
  const unsubscribeUI = ui.subscribe(($ui) => {
    const previousActiveItemId = activeItemId;
    activeItemId = $ui.activeItemId;
    
    // Store search term for later processing after content is loaded
    const searchTermToProcess = $ui.searchTerm;
    
    // Trigger update of active record with current database state
    // Use setTimeout to ensure the UI update happens after the active item ID update
    setTimeout(() => {
      // If the active item changed, immediately persist current editor content to avoid data loss
      if (previousActiveItemId && previousActiveItemId !== activeItemId) {
        try {
          if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
          }
          // Fire-and-forget save of current editor content
          if (quill && activeRecord && activeRecord.id) {
            const currentContent = quill.getContents();
            // Avoid unnecessary writes when content is identical
            const prevContent = activeRecord.content;
            const same = JSON.stringify(currentContent) === JSON.stringify(prevContent);
            if (!same) {
              saveContentToDatabase(activeRecord.id, currentContent);
            }
          }
        } catch (e) {
          console.error('Immediate save before switching item failed:', e);
        }
      }
      
      updateActiveRecordWithCurrentDatabase();
      
      // Process search term after content is loaded
      if (searchTermToProcess) {
        setTimeout(() => {
          if (quill && activeRecord) {
            positionCursorAtSearchTerm(searchTermToProcess);
            // Clear the search term after positioning
            ui.setSearchTerm(null);
          }
        }, 200); // Increased delay to ensure content is fully loaded
      }
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

  async function initQuill() {
    if (!browser) return;
    if (!editor) return;
    // If an existing instance is still attached to DOM, reuse it
    if (quill && quill.root && document.contains(quill.root)) {
      return;
    }
    const { default: Quill } = await import('quill');
    quill = new Quill(editor, {
      theme: 'bubble',
      modules: {
        toolbar: getToolbarOptions()
      }
    });

    // Set initial content for the currently active record
    if (activeRecord && activeRecord.content) {
      quill.setContents(activeRecord.content);
      applyHighlightsForRecord(activeRecord);
    }

      // Handle text changes with debounced saving (only on user edits)
    quill.on('text-change', (_delta: any, _old: any, source: string) => {
      if (source !== 'user') return;
      if (quill && activeRecord) {
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(() => {
          if (quill && activeRecord && activeRecord.id) {
            const content = quill.getContents();
            saveContentToDatabase(activeRecord.id, content);
          }
        }, 5000);

        // After a short delay, verify cloze ranges still have content; if a cloze's text was deleted,
        // remove the cloze from parent and delete the cloze subitem.
        if (cleanupClozeTimeout) clearTimeout(cleanupClozeTimeout);
        cleanupClozeTimeout = setTimeout(async () => {
          try {
            if (!quill || !activeRecord) return;
            if (activeRecord.contentType !== 'Extract' || !Array.isArray(activeRecord.clozes) || activeRecord.clozes.length === 0) return;
            const docLen = quill.getLength();
            const toRemove: { start: number; stop: number }[] = [];
            for (const c of activeRecord.clozes) {
              const start = c.startindex;
              const stop = c.stopindex;
              const len = Math.max(0, stop - start);
              if (len <= 0 || start >= docLen || stop > docLen) {
                toRemove.push({ start, stop });
                continue;
              }
              const segment = quill.getText(start, len);
              if ((segment || '').trim().length === 0) toRemove.push({ start, stop });
            }
            if (toRemove.length > 0 && activeRecord.id) {
              // Get the current content from the editor
              const currentContent = quill.getContents();
              
              // Get current cursor position
              const currentSelection = quill.getSelection();
              const cursorIndex = currentSelection ? currentSelection.index : 0;
              
              // Remove the deleted text from the content by creating a new Delta
              // that excludes the ranges where text was deleted
              const newOps: any[] = [];
              let currentIndex = 0;
              let newCursorIndex = cursorIndex;
              
              // Sort toRemove by start index to process in order
              const sortedToRemove = [...toRemove].sort((a, b) => a.start - b.start);
              
              // Calculate cursor position adjustment
              for (const removeRange of sortedToRemove) {
                if (cursorIndex > removeRange.start) {
                  if (cursorIndex >= removeRange.stop) {
                    // Cursor is after the removed range, adjust by the length of removed text
                    newCursorIndex -= (removeRange.stop - removeRange.start);
                  } else {
                    // Cursor is within the removed range, move it to the start of the range
                    newCursorIndex = removeRange.start;
                  }
                }
              }
              
              for (const op of currentContent.ops || []) {
                if (typeof op.insert === 'string') {
                  const opLength = op.insert.length;
                  const opStart = currentIndex;
                  const opEnd = currentIndex + opLength;
                  
                  // Check if this op overlaps with any removed range
                  let shouldInclude = true;
                  let adjustedInsert = op.insert;
                  
                  for (const removeRange of sortedToRemove) {
                    if (opEnd <= removeRange.start || opStart >= removeRange.stop) {
                      // No overlap, keep as is
                      continue;
                    } else {
                      // There's overlap, we need to remove the overlapping part
                      const overlapStart = Math.max(opStart, removeRange.start);
                      const overlapEnd = Math.min(opEnd, removeRange.stop);
                      const overlapLength = overlapEnd - overlapStart;
                      
                      if (overlapStart === opStart && overlapEnd === opEnd) {
                        // This op is completely within a removed range
                        shouldInclude = false;
                        break;
                      } else {
                        // Partial overlap, remove the overlapping part
                        const beforeOverlap = overlapStart - opStart;
                        const afterOverlap = opEnd - overlapEnd;
                        adjustedInsert = op.insert.substring(0, beforeOverlap) + op.insert.substring(opLength - afterOverlap);
                      }
                    }
                  }
                  
                  if (shouldInclude && adjustedInsert.length > 0) {
                    newOps.push({ ...op, insert: adjustedInsert });
                  }
                  
                  currentIndex += opLength;
                } else {
                  // Non-string ops (like formatting) - keep as is
                  newOps.push(op);
                }
              }
              
              const cleanedContent = { ops: newOps };
              
              // Update the clozes array to remove the deleted ranges
              const newClozes = (activeRecord.clozes || []).filter(
                (c) => !toRemove.some((r) => r.start === c.startindex && r.stop === c.stopindex)
              );
              
              // Update both content and clozes in a single operation
              await database.updateRecordRemotely(activeRecord.id, { 
                content: cleanedContent,
                clozes: newClozes 
              });
              
              try {
                const parentPrefix = `${activeRecord.id}/`;
                const children = (currentDatabase?.items || []).filter((r: Record) => r.contentType === 'Cloze' && r.id.startsWith(parentPrefix));
                for (const r of toRemove) {
                  const match = children.find((child: Record) => Array.isArray(child.clozes) && child.clozes.length > 0 && child.clozes[0].startindex === r.start && child.clozes[0].stopindex === r.stop);
                  if (match) await database.removeRecordById(match.id, { skipParentClozeUpdate: true });
                }
              } catch (e) {
                console.error('Failed to remove cloze subitems after text deletion', e);
              }
              
              // Update local activeRecord and re-apply highlights
              activeRecord = { ...activeRecord, clozes: newClozes, content: cleanedContent };
              queueMicrotask(() => {
                applyHighlightsForRecord(activeRecord!);
                // Restore cursor position after content update
                if (quill && newCursorIndex >= 0) {
                  const maxLength = quill.getLength();
                  const safeIndex = Math.min(newCursorIndex, maxLength - 1);
                  quill.setSelection(safeIndex, 0);
                }
              });
            }
          } catch (e) {
            console.error('Cloze cleanup after edit failed:', e);
          }
        }, 600);
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

    // Handle paste, drop and keydown events
    quill.root.addEventListener('paste', handlePaste);
    quill.root.addEventListener('drop', handleDrop);
    quill.root.addEventListener('keydown', handleKeyDown);
  }

  onMount(async () => {
    if (editor) {
      await initQuill();
    }
    // Add global keydown listener
    // window.addEventListener('keydown', handleGlobalKeyDown); // Handled by keyboard.service.ts
  });

  // Re-initialize Quill when returning from learning mode and the editor is re-mounted
  $effect(() => {
    if (!isLearningMode && editor) {
      // Fire and forget; we don't need the disposer to be async
      initQuill().then(() => {
        if (quill && activeRecord && activeRecord.content) {
          updateQuillContent(activeRecord);
        }
      });
    }
  });


  // Function to save content to database
  const saveContentToDatabase = async (recordId: string, content: any) => {
    try {
      await database.updateRecordRemotely(recordId, { content });
      
    } catch (error) {
      console.error('Error saving content to database:', error);
      toast.error('Error saving content');
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
        // Update Quill content when not in learning mode.
        // If we just exited learning mode, Quill may not be initialized yet, so guard and retry via init effect.
        if (!isLearningMode && quill) {
          updateQuillContent(record);
        }
      }
    } else {
      // For now, just load the first record with content if no active item
      const recordWithContent = $database.items.find((item: Record) =>
        item.contentType === 'Extract' || item.contentType === 'Cloze'
      );
      
      if (recordWithContent && recordWithContent.content) {
        activeRecord = recordWithContent;
        if (!isLearningMode && quill) {
          updateQuillContent(recordWithContent);
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
      // Apply visual highlights depending on record type
      // Use a microtask to ensure Quill applies contents before formatting
      queueMicrotask(() => {
        applyHighlightsForRecord(record);
        
        // Check if there's a search term to position cursor at
        const currentUI = get(ui);
        if (currentUI.searchTerm) {
          setTimeout(() => {
            positionCursorAtSearchTerm(currentUI.searchTerm!);
            // Clear the search term after positioning
            ui.setSearchTerm(null);
          }, 100);
        }
      });
      
    } else {
      
    }
  };

  function applyHighlightsForRecord(record: Record) {
    if (!quill) return;
    const YELLOW = '#f9ff24';
    const THEME_CLOZE_BG = `rgba(var(--background-color_button), 0.35)`;
    try {
      // Clear any previous background highlights before applying fresh ones
      const totalLength = quill.getLength();
      if (totalLength > 0) {
        quill.formatText(0, totalLength, 'background', false);
      }

      if (record.contentType === 'Extract' && record.clozes && record.clozes.length > 0) {
        record.clozes.forEach((c) => {
          const start = c.startindex;
          const len = Math.max(0, c.stopindex - c.startindex);
          if (len > 0) quill!.formatText(start, len, { background: THEME_CLOZE_BG });
        });
      } else if (record.contentType === 'Cloze' && record.clozes && record.clozes.length > 0) {
        // Only highlight the specific cloze of this subitem
        const c = record.clozes[0];
        const start = c.startindex;
        const len = Math.max(0, c.stopindex - c.startindex);
        if (len > 0) quill!.formatText(start, len, { background: THEME_CLOZE_BG });
      }
    } catch (e) {
      // Non-fatal: highlighting is best-effort
      console.error('Failed to apply highlights for record:', e);
    }
  }

  function positionCursorAtSearchTerm(searchTerm: string) {
    if (!quill) return;
    
    try {
      const text = quill.getText();
      const searchIndex = text.toLowerCase().indexOf(searchTerm.toLowerCase());
      
      if (searchIndex !== -1) {
        // Position cursor at the start of the search term
        quill.setSelection(searchIndex, searchTerm.length);
        
        // Scroll to the position
        const bounds = quill.getBounds(searchIndex);
        if (bounds) {
          const editorElement = quill.root;
          if (editorElement) {
            editorElement.scrollTop = bounds.top - 100; // Offset to show some context above
          }
        }
      }
    } catch (e) {
      console.error('Failed to position cursor at search term:', e);
    }
  }

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
          
          // Toggle behavior: if selection matches an existing cloze range on the parent Extract, remove it
          if (activeRecord.contentType === 'Extract' && Array.isArray(activeRecord.clozes)) {
            const start = range.index;
            const stop = range.index + range.length;
            const existing = activeRecord.clozes.find(
              (c) => c.startindex === start && c.stopindex === stop
            );
            if (existing) {
              // 1) Update parent clozes (remove the range)
              const updatedClozes = activeRecord.clozes.filter(
                (c) => !(c.startindex === start && c.stopindex === stop)
              );
              await database.updateRecordRemotely(activeRecord.id, { clozes: updatedClozes });

              // 2) Find and remove the matching Cloze subitem (if any)
              let childId: string | null = null;
              try {
                const parentIdPrefix = `${activeRecord.id}/`;
                const children = (currentDatabase?.items || []).filter(
                  (r: Record) => r.contentType === 'Cloze' && r.id.startsWith(parentIdPrefix)
                );
                const match = children.find(
                  (r: Record) => Array.isArray(r.clozes) && r.clozes.length > 0 && r.clozes[0].startindex === start && r.clozes[0].stopindex === stop
                );
                if (match) childId = match.id;
              } catch {}

              if (childId) {
                await database.removeRecordById(childId, { skipParentClozeUpdate: true });
              }

              // 2.5) Remove visual highlight in the editor immediately
              try {
                if (quill) {
                  const len = stop - start;
                  if (len > 0) {
                    // Remove background highlight for this range
                    quill.formatText(start, len, 'background', false);
                  }
                }
              } catch {}

              // 3) Clear selection and notify
              quill.setSelection(null);
              toast.success('Cloze removed');
              return;
            }
          }

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
          
          // Ensure parent content is saved immediately before adding the cloze
          if (activeRecord.id) {
            await database.updateRecordRemotely(activeRecord.id, { content: contentDelta });
          }
          // Add cloze as sub-item
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
        toast.success('Cloze created successfully');
      } catch (error) {
        console.error('Error creating cloze:', error);
        toast.error('Error creating cloze');
      }
    } else {
      toast.info('Please select text to create a cloze');
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
        toast.success('Extract created successfully');
      } catch (error) {
        console.error('Error creating extract:', error);
        toast.error('Error creating extract');
      }
    } else {
      toast.info('Please select text to create an extract');
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
        toast.success('Text summarized successfully');
      } catch (error) {
        console.error('Error summarizing text:', error);
        toast.error('Error summarizing text');
      }
    } else {
      toast.info('Please select text to summarize');
    }
  };

  // Function to create an occlusion
  const createOcclusion = (separateOcclusions: boolean) => {
    if (activeRecord) {
      try {
        // This would typically involve creating occlusions from the active image
        // For now, we'll just show a success message
        
        toast.success('Occlusion created successfully');
      } catch (error) {
        console.error('Error creating occlusion:', error);
        toast.error('Error creating occlusion');
      }
    } else {
      toast.info('No active record to create occlusion');
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
        toast.error('Error flagging item');
      }
    } else {
      toast.info('No active record to flag');
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
          toast.success('Image imported successfully');
        } catch (error) {
          console.error('Error importing image:', error);
          toast.error('Error importing image');
        }
      }
      // Handle PDF files
      else if (file.type === 'application/pdf') {
        try {
          // In a real implementation, this would parse the PDF and create records
          
          toast.success('PDF imported successfully');
        } catch (error) {
          console.error('Error importing PDF:', error);
          toast.error('Error importing PDF');
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
          toast.success('Text imported successfully');
        } catch (error) {
          console.error('Error importing text:', error);
          toast.error('Error importing text');
        }
      }
    }
  };

  // Function to handle context menu
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    contextmenu.showContextMenu(e.clientX, e.clientY, null, 'content-area');
  };

  // Global keyboard handler for spotlight search
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    // If Settings modal is open (e.g., recording a shortcut), don't trigger spotlight
    const modals = get(modal);
    if (modals.isSettingsModalOpen) return;
    // Don't trigger if user is typing in an input field, textarea, or contenteditable
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' ||
        target.closest('[contenteditable]') ||
        target.closest('input') ||
        target.closest('textarea')) {
      return;
    }

    // Don't trigger on modifier keys or special keys
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
      return;
    }

    // Don't trigger on function keys, arrow keys, etc.
    if (e.key.length > 1) {
      return;
    }

    // Only trigger on printable characters
    if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9\s\-_.,!?;:'"()[\]{}@#$%^&*+=<>/\\|`~]/)) {
      // Clear any existing timeout
      if (globalKeyTimeout) {
        clearTimeout(globalKeyTimeout);
      }

      // Add character to buffer
      globalKeyBuffer += e.key;

      // Check if spotlight search is already open
      const currentModal = get(modal);
      if (!currentModal.isSpotlightSearchModalOpen) {
        // Open spotlight search with the typed characters
        modal.openSpotlightSearchModal();
        
        // Set the search term in the UI store
        ui.setSearchTerm(globalKeyBuffer);
      } else {
        // If already open, just update the search term
        ui.setSearchTerm(globalKeyBuffer);
      }

      // Clear buffer after a delay
      globalKeyTimeout = setTimeout(() => {
        globalKeyBuffer = '';
      }, 1000);

      // Prevent default behavior
      e.preventDefault();
    }
  };

  // Set up global keyboard listener
  onMount(() => {
    if (browser) {
      document.addEventListener('keydown', handleGlobalKeydown);
    }
  });

  // Clean up global keyboard listener
  onDestroy(() => {
    if (browser) {
      document.removeEventListener('keydown', handleGlobalKeydown);
    }
    if (globalKeyTimeout) {
      clearTimeout(globalKeyTimeout);
    }
  });
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
