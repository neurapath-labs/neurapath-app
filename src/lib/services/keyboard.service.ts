import { get } from 'svelte/store';
import { profile } from '$lib/stores/profile.store';
import { modal } from '$lib/stores/modal.store';
import { selection } from '$lib/stores/selection.store';
import { database } from '$lib/stores/database.store';
import { learning } from '$lib/stores/learning.store';
import { ui } from '$lib/stores/ui.store';
import { createID } from '$lib/utils/helpers';
import { toast } from "svelte-sonner";
import type { Shortcut, Record } from '$lib/models';

class KeyboardService {
  private shortcuts: Shortcut[] = [];

  constructor() {
    this.init = this.init.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.executeShortcut = this.executeShortcut.bind(this);
    this.createCloze = this.createCloze.bind(this);
    this.createExtract = this.createExtract.bind(this);
    this.flagItem = this.flagItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.duplicateItem = this.duplicateItem.bind(this);
    this.createFolder = this.createFolder.bind(this);
    this.createTextDocument = this.createTextDocument.bind(this);
    this.destroy = this.destroy.bind(this);
    this.init();
  }

  private init() {
    // Add global keydown listener
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    const isInputField = (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable)
    );

    // Get current shortcuts from profile
    const profileData = get(profile);
    this.shortcuts = profileData.shortcuts || [];
    // 

    // Match the key event with defined shortcuts
    const matchedShortcut = this.shortcuts.find((shortcut) => {
      // Check if keyCode and shift key match
      if (event.keyCode !== shortcut.keyCode || event.shiftKey !== (shortcut.shift || false)) {
        return false;
      }
      
      // Check if alt key matches
      if (event.altKey !== shortcut.altKey) {
        return false;
      }
      
      // For modifier keys, we want to match either ctrlKey or metaKey (Cmd on Mac, Ctrl on Windows)
      // The shortcut definition has both ctrlKey and metaKey as true, which means it requires both
      // Instead, we should match if either one is pressed (platform-appropriate modifier)
      const hasCtrl = event.ctrlKey;
      const hasMeta = event.metaKey;
      const shortcutWantsCtrl = shortcut.ctrlKey;
      const shortcutWantsMeta = shortcut.metaKey;
      
      // If shortcut requires a modifier, match either Ctrl or Cmd (but not both necessarily)
      if (shortcutWantsCtrl || shortcutWantsMeta) {
        return hasCtrl || hasMeta;
      } else {
        // If shortcut doesn't require a modifier, neither should be pressed
        return !hasCtrl && !hasMeta;
      }
    });
    // 
    //   keyCode: event.keyCode,
    //   altKey: event.altKey,
    //   ctrlKey: event.ctrlKey,
    //   metaKey: event.metaKey,
    //   shiftKey: event.shiftKey
    // });
    // 

    // If we're in an input field and there's no matched shortcut, return early
    if (isInputField && !matchedShortcut) {
      return;
    }

    // If we're in an input field, only allow shortcuts with modifier keys to prevent interference with typing
    if (isInputField && matchedShortcut) {
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
      if (!hasModifier) {
        return;
      }
    }

    if (matchedShortcut) {
      // 
      event.preventDefault();
      this.executeShortcut(matchedShortcut.event);
    }
  }

  private async executeShortcut(event: string) {
    // Get learning mode state
    const learningData = get(learning);
    const isInLearningMode = learningData.isInLearningMode;

    switch (event) {
      // Spotlight search
      case 'input-spotlight-toggle':
        modal.openSpotlightSearchModal();
        break;

      // Create cloze (only when not in learning mode)
      case 'input-create-cloze':
        if (!isInLearningMode) {
          await this.createCloze();
        }
        break;

      // Create image occlusion (only when not in learning mode)
      case 'input-create-occlusion':
        if (!isInLearningMode) {
          modal.openOcclusionCreateModal();
        }
        break;

      // Create separate occlusions (only when not in learning mode)
      case 'input-create-occlusion-separate':
        if (!isInLearningMode) {
          // Implementation would depend on context
          toast('Create separate occlusions functionality not yet implemented');
        }
        break;

      // Show answer for occlusion (learning mode specific)
      case 'learning-show-answer':
      case 'input-show-occlusion':
        // These are handled in LearningMode.svelte
        break;

      // Create extract from selection (only when not in learning mode)
      case 'input-create-extract':
        if (!isInLearningMode) {
          await this.createExtract();
        }
        break;

      // Summarize selected text with AI (only when not in learning mode)
      case 'input-text-summarize':
        if (!isInLearningMode) {
          modal.openSummaryModal();
        }
        break;

      // Flag item (works in both modes)
      case 'input-flag-item':
        await this.flagItem();
        break;

      // Remove selected item (Delete/Backspace - only when not in learning mode)
      case 'input-remove-item':
        if (!isInLearningMode) {
          await this.removeItem();
        }
        break;

      // Rename selected item (F2 - only when not in learning mode)
      case 'input-rename-item':
        if (!isInLearningMode) {
          // Implementation would depend on context
          toast('Rename item functionality not yet implemented');
        }
        break;

      // Duplicate selected item (Ctrl/Cmd + D - only when not in learning mode)
      case 'input-duplicate-item':
        if (!isInLearningMode) {
          await this.duplicateItem();
        }
        break;

      // Create folder (Ctrl/Cmd + Shift + N - only when not in learning mode)
      case 'input-create-folder':
        if (!isInLearningMode) {
          await this.createFolder();
        }
        break;

      // Create text document (Ctrl/Cmd + N - only when not in learning mode)
      case 'input-create-text':
        if (!isInLearningMode) {
          await this.createTextDocument();
        }
        break;

      // Open settings (Ctrl/Cmd + , - only when not in learning mode)
      case 'input-open-settings':
        if (!isInLearningMode) {
          modal.openSettingsModal();
        }
        break;

      // Grade items (1-5 - learning mode specific)
      case 'input-grade-item1':
      case 'input-grade-item2':
      case 'input-grade-item3':
      case 'input-grade-item4':
      case 'input-grade-item5':
        // These are handled in LearningMode.svelte
        break;

      // Learning mode specific shortcuts
      case 'learning-flag-item':
      case 'learning-skip-item':
        // These are handled in LearningMode.svelte
        break;

      // Default case
      default:

        break;
    }
  }

  private async createCloze() {
    // Get current selection
    const selectionData = get(selection);

    // 

    if (!selectionData || !selectionData.isSelected || !selectionData.text) {
      toast('Please select text to create a cloze');
      return;
    }

    // Get active record
    const databaseData = get(database);
    const uiData = get(ui);
    const activeItemId = uiData.activeItemId;
    
    // Find the active record based on the active item ID
    const activeRecord = activeItemId
      ? databaseData.items.find(item => item.id === activeItemId)
      : null;

    if (!activeRecord) {
      toast('Please select an item to create a cloze first');
      return;
    }

    try {
      const range = selectionData.range;
      if (!range) {
        toast('Invalid selection range');
        return;
      }

      // Capture current content to ensure parent is saved before creating subitem
      const contentDelta = {
        ops: [
          {
            insert: selectionData.text
          }
        ]
      };

      // Create new record for the cloze
      let newRecordId: string;
      
      // If the active record is an Extract, create the cloze as a subitem
      if (activeRecord.contentType === 'Extract') {
        newRecordId = activeRecord.id + "/" + createID(6);
      } else {
        // Otherwise, use the existing logic
        newRecordId = (activeRecord.id || "record") + "/" + createID(6);
      }

      const newRecord: Record = {
        id: newRecordId,
        contentType: "Cloze",
        content: contentDelta
      };

      // Force save parent content before adding the cloze subitem
      if (activeRecord.id) {
        await database.updateRecordRemotely(activeRecord.id, { content: activeRecord.content || contentDelta });
      }
      // Add to database
      await database.addRecord(newRecord);

      toast('Cloze created successfully');
    } catch (error) {
      console.error('Error creating cloze:', error);
      toast('Error creating cloze');
    }
  }

  private async createExtract() {
    // Get current selection
    const selectionData = get(selection);

    if (!selectionData || !selectionData.isSelected || !selectionData.text) {
      toast('Please select text to create an extract');
      return;
    }

    // Get active record
    const databaseData = get(database);
    const uiData = get(ui);
    const activeItemId = uiData.activeItemId;
    
    // Find the active record based on the active item ID
    const activeRecord = activeItemId
      ? databaseData.items.find(item => item.id === activeItemId)
      : null;

    if (!activeRecord) {
      toast('Please select an item to create an extract first');
      return;
    }

    try {
      // Create new record for the extract
      const newRecordId = (activeRecord.id || "record") + "/" + createID(6);
      
      const newRecord: Record = {
        id: newRecordId,
        contentType: "Extract",
        content: {
          "ops": [
            {
              "insert": selectionData.text
            }
          ]
        }
      };

      // Add to database
      await database.addRecord(newRecord);

      toast('Extract created successfully');
    } catch (error) {
      console.error('Error creating extract:', error);
      toast('Error creating extract');
    }
  }

  private async flagItem() {
    // Get active record
    const uiData = get(ui);
    const activeItemId = uiData.activeItemId;
    
    if (!activeItemId) {
      toast('Please select an item to flag first');
      return;
    }

    // Find the active record based on the active item ID
    const activeRecord = database.getRecordById(activeItemId);

    if (!activeRecord || !activeRecord.id) {
      toast('Please select an item to flag first');
      return;
    }

    try {
      // Toggle flagged status
      const isFlagged = !(activeRecord.isFlagged || false);
      await database.updateRecordRemotely(activeRecord.id, { isFlagged });
      
      toast(`Item ${isFlagged ? 'flagged' : 'unflagged'} successfully`);
    } catch (error) {
      console.error('Error flagging item:', error);
      toast('Error flagging item');
    }
  }

  private async removeItem() {
    // Get active record
    const databaseData = get(database);
    const uiData = get(ui);
    const activeItemId = uiData.activeItemId;
    
    // Find the active record based on the active item ID
    const activeRecord = activeItemId
      ? databaseData.items.find(item => item.id === activeItemId)
      : null;

    if (!activeRecord || !activeRecord.id) {
      toast('Please select an item to remove first');
      return;
    }

    try {
      // Remove from database
      await database.removeRecordById(activeRecord.id);
      
      toast('Item removed successfully');
    } catch (error) {
      console.error('Error removing item:', error);
      toast('Error removing item');
    }
  }

  private async duplicateItem() {
    // Get active record
    const databaseData = get(database);
    const uiData = get(ui);
    const activeItemId = uiData.activeItemId;
    
    // Find the active record based on the active item ID
    const activeRecord = activeItemId
      ? databaseData.items.find(item => item.id === activeItemId)
      : null;

    if (!activeRecord) {
      toast('Please select an item to duplicate first');
      return;
    }

    try {
      // Create new record with duplicated content
      const newRecordId = "Copy of " + activeRecord.id;
      
      const newRecord: Record = {
        ...activeRecord,
        id: newRecordId
      } as Record;

      // Add to database
      await database.addRecord(newRecord);

      toast('Item duplicated successfully');
    } catch (error) {
      console.error('Error duplicating item:', error);
      toast('Error duplicating item');
    }
  }

  private async createFolder() {
    try {
      // Create new folder record
      const newRecordId = "New Folder " + createID(4);
      
      const newRecord: Record = {
        id: newRecordId,
        contentType: "Folder"
      };

      // Add to database
      await database.addRecord(newRecord);

      toast('Folder created successfully');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast('Error creating folder');
    }
  }

  private async createTextDocument() {
    try {
      // Create new text document record
      const newRecordId = "New Document " + createID(4);
      
      const newRecord: Record = {
        id: newRecordId,
        contentType: "Extract",
        content: {
          "ops": [
            {
              "insert": "New document content"
            }
          ]
        }
      };

      // Add to database
      await database.addRecord(newRecord);

      toast('Text document created successfully');
    } catch (error) {
      console.error('Error creating text document:', error);
      toast('Error creating text document');
    }
  }

  // Cleanup method
  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
    }
  }
}

// Export singleton instance
export const keyboardService = new KeyboardService();