<script lang="ts">
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { modal } from '$lib/stores/modal.store';
  import { database } from '$lib/stores/database.store';
  import { selection } from '$lib/stores/selection.store';
  import { occlusion } from '$lib/stores/occlusion.store';
  import { ui } from '$lib/stores/ui.store';
  import { createID } from '$lib/utils/helpers';
  import type { Record } from '$lib/models';

  // Define interfaces locally since they're not exported from the store files
  interface ContextMenuState {
    isVisible: boolean;
    x: number;
    y: number;
    targetId: string | null;
    targetType: 'sidebar-item' | 'sidebar-right-item' | 'content-area' | null;
  }

  interface SelectionState {
    isSelected: boolean;
    text: string;
    range: {
      index: number;
      length: number;
    } | null;
  }

  // Use Svelte 5 runes for reactive state
  let contextMenuState = $state<ContextMenuState>({ isVisible: false, x: 0, y: 0, targetId: null, targetType: null });
  let targetRecord = $state<Record | null>(null);
  let selectionState = $state<SelectionState>({ isSelected: false, text: '', range: null });

  // Subscribe to context menu state
  $effect(() => {
    return contextmenu.subscribe((state) => {
      contextMenuState = state;
      
      // If a target ID is set, get the record
      if (state.targetId) {
        targetRecord = database.getRecordById(state.targetId) || null;
      } else {
        targetRecord = null;
      }
    });
  });

  // Subscribe to selection state
  $effect(() => {
    return selection.subscribe((state) => {
      selectionState = state;
    });
  });

  // Function to handle create extract from selection
  async function handleCreateExtract() {
    if (selectionState.isSelected && contextMenuState.targetId) {
      try {
        const range = selectionState.range;
        if (range) {
          // Get the target record
          const targetRecord = database.getRecordById(contextMenuState.targetId);
          if (targetRecord) {
            // Create new record for the extract
            const newRecordId = targetRecord.id + "/" + createID(6);
            const newRecord: Record = {
              id: newRecordId,
              contentType: "Extract",
              content: {
                ops: [
                  {
                    insert: selectionState.text
                  }
                ]
              }
            };
            
            // Add to database
            await database.addRecord(newRecord);
            
            contextmenu.hideContextMenu();
            modal.showAlert('Extract created successfully', 'success');
            return;
          }
        }
      } catch (error) {
        console.error('Error creating extract:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error creating extract', 'danger');
        return;
      }
    }
    modal.showAlert('Please select text to create an extract', 'warning');
    contextmenu.hideContextMenu();
  }

  // Function to handle create cloze deletion
  async function handleCreateCloze() {
    if (selectionState.isSelected && contextMenuState.targetId) {
      try {
        const range = selectionState.range;
        if (range) {
          // Get the target record
          const targetRecord = database.getRecordById(contextMenuState.targetId);
          if (targetRecord) {
            // Create new record for the cloze
            const newRecordId = targetRecord.id + "/" + createID(6);
            const newRecord: Record = {
              id: newRecordId,
              contentType: "Cloze",
              content: targetRecord.content,
              clozes: [
                {
                  cloze: selectionState.text,
                  startindex: range.index,
                  stopindex: range.index + range.length
                }
              ]
            };
            
            // Add to database
            await database.addRecord(newRecord);
            
            contextmenu.hideContextMenu();
            modal.showAlert('Cloze created successfully', 'success');
            return;
          }
        }
      } catch (error) {
        console.error('Error creating cloze:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error creating cloze', 'danger');
        return;
      }
    }
    modal.showAlert('Please select text to create a cloze', 'warning');
    contextmenu.hideContextMenu();
  }

  // Function to handle create folder
  async function handleCreateFolder() {
    try {
      const id = createID(6);
      const newFolder: Record = {
        id: id,
        contentType: 'Folder'
      };
      await database.addRecord(newFolder);
      contextmenu.hideContextMenu();
      modal.showAlert('Folder created successfully', 'success');
    } catch (error) {
      console.error('Error creating folder:', error);
      contextmenu.hideContextMenu();
      modal.showAlert('Error creating folder', 'danger');
    }
  }

  // Function to handle create text
  async function handleCreateText() {
    try {
      const id = createID(6);
      const newText: Record = {
        id: id,
        contentType: 'Extract',
        content: {
          ops: [
            {
              insert: "New text item"
            }
          ]
        }
      };
      await database.addRecord(newText);
      contextmenu.hideContextMenu();
      modal.showAlert('Text created successfully', 'success');
    } catch (error) {
      console.error('Error creating text:', error);
      contextmenu.hideContextMenu();
      modal.showAlert('Error creating text', 'danger');
    }
  }

  // Function to handle remove item
  async function handleRemoveItem() {
    if (contextMenuState.targetId) {
      try {
        await database.removeRecordById(contextMenuState.targetId);
        contextmenu.hideContextMenu();
        modal.showAlert('Item removed successfully', 'success');
      } catch (error) {
        console.error('Error removing item:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error removing item', 'danger');
      }
    }
  }

  // Function to handle rename item
  async function handleRenameItem() {
    if (contextMenuState.targetId) {
      // In a real implementation, we would show a prompt to get the new name
      // For now, we'll just demonstrate the update functionality
      try {
        // Get the current item
        const currentItem = database.getRecordById(contextMenuState.targetId);
        if (currentItem) {
          // For demonstration, we'll just update a property
          // In a real app, we would update the id or other properties
          await database.updateRecordRemotely(contextMenuState.targetId, {
            ...currentItem,
            // Example update - in a real app this would be the new name
          });
          contextmenu.hideContextMenu();
          modal.showAlert('Item renamed successfully', 'success');
        }
      } catch (error) {
        console.error('Error renaming item:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error renaming item', 'danger');
      }
    }
  }

  // Function to handle duplicate item
  async function handleDuplicateItem() {
    if (contextMenuState.targetId) {
      try {
        // Get the current item
        const currentItem = database.getRecordById(contextMenuState.targetId);
        if (currentItem) {
          // Create a new item with a new ID
          const newItem = {
            ...currentItem,
            id: createID(6) // Generate a new ID
          };
          await database.addRecord(newItem);
          contextmenu.hideContextMenu();
          modal.showAlert('Item duplicated successfully', 'success');
        }
      } catch (error) {
        console.error('Error duplicating item:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error duplicating item', 'danger');
      }
    }
  }

  // Function to handle flag item
  async function handleFlagItem() {
    if (contextMenuState.targetId) {
      try {
        await database.updateRecordRemotely(contextMenuState.targetId, {
          isFlagged: true
        });
        contextmenu.hideContextMenu();
        modal.showAlert('Item flagged successfully', 'success');
      } catch (error) {
        console.error('Error flagging item:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error flagging item', 'danger');
      }
    }
  }

  // Function to handle unflag item
  async function handleUnflagItem() {
    if (contextMenuState.targetId) {
      try {
        await database.updateRecordRemotely(contextMenuState.targetId, {
          isFlagged: false
        });
        contextmenu.hideContextMenu();
        modal.showAlert('Item unflagged successfully', 'success');
      } catch (error) {
        console.error('Error unflagging item:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error unflagging item', 'danger');
      }
    }
  }

  // Function to handle postpone 7 days
  async function handlePostpone7Days() {
    if (contextMenuState.targetId) {
      try {
        // Calculate new due date (postpone by 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        await database.updateRecordRemotely(contextMenuState.targetId, {
          dueDate: nextWeek.toISOString()
        });
        contextmenu.hideContextMenu();
        modal.showAlert('Item postponed successfully', 'success');
      } catch (error) {
        console.error('Error postponing item:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error postponing item', 'danger');
      }
    }
  }

  // Function to handle postpone 30 days
  async function handlePostpone30Days() {
    if (contextMenuState.targetId) {
      try {
        // Calculate new due date (postpone by 30 days)
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        
        await database.updateRecordRemotely(contextMenuState.targetId, {
          dueDate: nextMonth.toISOString()
        });
        contextmenu.hideContextMenu();
        modal.showAlert('Item postponed successfully', 'success');
      } catch (error) {
        console.error('Error postponing item:', error);
        contextmenu.hideContextMenu();
        modal.showAlert('Error postponing item', 'danger');
      }
    }
  }

  // Function to handle import database
  async function handleImportDatabase() {
    try {
      // In a real implementation, we would read from a file
      // For now, we'll just demonstrate the load functionality
      await database.loadDatabase('demo-user');
      contextmenu.hideContextMenu();
      modal.showAlert('Database imported successfully', 'success');
    } catch (error) {
      console.error('Error importing database:', error);
      contextmenu.hideContextMenu();
      modal.showAlert('Error importing database', 'danger');
    }
  }

  // Function to handle export database
  async function handleExportDatabase() {
    try {
      // In a real implementation, we would write to a file
      // For now, we'll just demonstrate the save functionality
      await database.saveDatabase('demo-user');
      contextmenu.hideContextMenu();
      modal.showAlert('Database exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting database:', error);
      contextmenu.hideContextMenu();
      modal.showAlert('Error exporting database', 'danger');
    }
  }

  // Function to handle import article
  function handleImportArticle() {
    // TODO: Implement article import logic
    contextmenu.hideContextMenu();
    modal.showAlert('Article imported successfully', 'success');
  }

  // Function to handle create occlusion
  function handleCreateOcclusion() {
    // TODO: Implement occlusion creation logic
    contextmenu.hideContextMenu();
    modal.showAlert('Occlusion created successfully', 'success');
  }
  
  // Function to handle share item
  function handleShareItem() {
    if (contextMenuState.targetId) {
      ui.openShareModal(contextMenuState.targetId);
      contextmenu.hideContextMenu();
    }
  }
  
  // Function to handle summarize text
  function handleSummarizeText() {
    if (selectionState.isSelected) {
      modal.openSummaryModal();
      contextmenu.hideContextMenu();
    } else {
      modal.showAlert('Please select text to summarize', 'warning');
      contextmenu.hideContextMenu();
    }
  }
</script>

<div
  id="modalbox-contextmenu"
  class="{(contextMenuState.isVisible) ? 'visible' : 'hidden'}"
  style="top: {contextMenuState.y}px; left: {contextMenuState.x}px;"
>
  <!-- Sidebar item context menu -->
  {#if contextMenuState.targetType === 'sidebar-item'}
    <div 
      id="contextmenu-remove-item" 
      class="{(targetRecord) ? '' : 'hidden'}"
      on:click={handleRemoveItem}
    >
      Remove item
    </div>
    <div 
      id="contextmenu-rename-item" 
      class="{(targetRecord) ? '' : 'hidden'}"
      on:click={handleRenameItem}
    >
      Rename item
    </div>
    <div 
      id="contextmenu-duplicate-item" 
      class="{(targetRecord) ? '' : 'hidden'}"
      on:click={handleDuplicateItem}
    >
      Duplicate item
    </div>
    <div 
      id="contextmenu-create-folder" 
      on:click={handleCreateFolder}
    >
      Create folder
    </div>
    <div 
      id="contextmenu-create-text" 
      on:click={handleCreateText}
    >
      Create text
    </div>
    <div 
      id="contextmenu-postpone-7days" 
      class="{(targetRecord) ? '' : 'hidden'}"
      on:click={handlePostpone7Days}
    >
      Postpone 7 days
    </div>
    <div 
      id="contextmenu-postpone-30days" 
      class="{(targetRecord) ? '' : 'hidden'}"
      on:click={handlePostpone30Days}
    >
      Postpone 30 days
    </div>
    <div 
      id="contextmenu-flag-item" 
      class="{(targetRecord && !targetRecord.isFlagged) ? '' : 'hidden'}"
      on:click={handleFlagItem}
    >
      Flag item
    </div>
    <div
      id="contextmenu-unflag-item"
      class="{(targetRecord && targetRecord.isFlagged) ? '' : 'hidden'}"
      on:click={handleUnflagItem}
    >
      Unflag item
    </div>
    <div
      id="contextmenu-share-item"
      class="{(targetRecord) ? '' : 'hidden'}"
      on:click={handleShareItem}
    >
      Share item
    </div>
  {:else if contextMenuState.targetType === 'content-area'}
    <div 
      id="contextmenu-create-extract" 
      class="{(selectionState.isSelected) ? '' : 'hidden'}"
      on:click={handleCreateExtract}
    >
      Create extract from selection
    </div>
    <div 
      id="contextmenu-create-cloze" 
      class="{(selectionState.isSelected) ? '' : 'hidden'}"
      on:click={handleCreateCloze}
    >
      Create cloze deletion
    </div>
    <div 
      id="contextmenu-create-occlusion" 
      on:click={handleCreateOcclusion}
    >
      Create image occlusion
    </div>
    <div 
      id="contextmenu-flag-item-content" 
      on:click={handleFlagItem}
    >
      Flag item
    </div>
    <div 
      id="contextmenu-import-database" 
      on:click={handleImportDatabase}
    >
      Import database
    </div>
    <div
      id="contextmenu-export-database"
      on:click={handleExportDatabase}
    >
      Export database
    </div>
    <div
      id="contextmenu-summarize-text"
      class="{(selectionState.isSelected) ? '' : 'hidden'}"
      on:click={handleSummarizeText}
    >
      Summarize selected text
    </div>
  {:else if contextMenuState.targetType === 'sidebar-right-item'}
    <div 
      id="contextmenu-sidebar-right-import-article" 
      on:click={handleImportArticle}
    >
      Import article
    </div>
    <div 
      id="contextmenu-sidebar-right-create-occlusion" 
      on:click={handleCreateOcclusion}
    >
      Create occlusion
    </div>
  {/if}
</div>

<style>
  #modalbox-contextmenu {
    position: absolute;
    z-index: 1000;
    background-color: rgb(var(--background-color_modalbox));
    border: 1px solid rgb(var(--font-color));
    border-radius: 4px;
    padding: 8px 0;
    min-width: 150px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  #modalbox-contextmenu.hidden {
    display: none;
  }

  #modalbox-contextmenu > div {
    padding: 8px 16px;
    cursor: pointer;
    color: rgb(var(--font-color));
  }

  #modalbox-contextmenu > div:hover {
    background-color: rgba(var(--background-color_button), 0.5);
  }

  #modalbox-contextmenu > div.hidden {
    display: none;
  }
</style>