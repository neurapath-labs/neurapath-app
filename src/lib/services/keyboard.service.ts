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
    this.init();
  }

  private init() {
    // Add global keydown listener
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Don't handle key events when typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable)
    ) {
      return;
    }

    // Get current shortcuts from profile
    const profileData = get(profile);
    this.shortcuts = profileData.shortcuts || [];

    // Match the key event with defined shortcuts
    const matchedShortcut = this.shortcuts.find((shortcut) => {
      return (
        event.keyCode === shortcut.keyCode &&
        event.altKey === shortcut.altKey &&
        event.ctrlKey === shortcut.ctrlKey &&
        event.metaKey === shortcut.metaKey &&
        event.shiftKey === (shortcut.shift || false)
      );
    });

    if (matchedShortcut) {
      event.preventDefault();
      this.executeShortcut(matchedShortcut.event);
    }
  }

  private async executeShortcut(event: string) {
    // Get learning mode state
    const learningData = get(learning);
    const isInLearningMode = learningData.isInLearningMode;

    switch (event) {
      // Spotlight search (only when not in learning mode)
      case 'input-spotlight-toggle':
        if (!isInLearningMode) {
          modal.openSpotlightSearchModal();
        }
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
        ('Unhandled shortcut event:', event);
        break;
    }
  }

  private async createCloze() {
    // Get current selection
    const selectionData = get(selection);

    (selectionData, selectionData.isSelected, selectionData.text);

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
      : databaseData.items.find(item =>
          item.contentType === 'Extract' || item.contentType === 'Cloze'
        ) || null;

    if (!activeRecord) {
      toast('No active record to create cloze');
      return;
    }

    try {
      const range = selectionData.range;
      if (!range) {
        toast('Invalid selection range');
        return;
      }

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
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze'
    ) || null;

    if (!activeRecord) {
      toast('No active record to create extract');
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
    const databaseData = get(database);
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
    ) || null;

    if (!activeRecord || !activeRecord.id) {
      toast('No active record to flag');
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
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
    ) || null;

    if (!activeRecord || !activeRecord.id) {
      toast('No active record to remove');
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
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
    ) || null;

    if (!activeRecord) {
      toast('No active record to duplicate');
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
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }
}

// Export singleton instance
export const keyboardService = new KeyboardService();