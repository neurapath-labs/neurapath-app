import { get } from 'svelte/store';
import { profile } from '$lib/stores/profile.store';
import { modal } from '$lib/stores/modal.store';
import { selection } from '$lib/stores/selection.store';
import { database } from '$lib/stores/database.store';
import { learning } from '$lib/stores/learning.store';
import { createID } from '$lib/utils/helpers';
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
          modal.showAlert('Create separate occlusions functionality not yet implemented', 'warning');
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
          modal.showAlert('Rename item functionality not yet implemented', 'warning');
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
        console.log('Unhandled shortcut event:', event);
        break;
    }
  }

  private async createCloze() {
    // Get current selection
    const selectionData = get(selection);

    if (!selectionData || !selectionData.isSelected || !selectionData.text) {
      modal.showAlert('Please select text to create a cloze', 'warning');
      return;
    }

    // Get active record
    const databaseData = get(database);
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze'
    ) || null;

    if (!activeRecord) {
      modal.showAlert('No active record to create cloze', 'warning');
      return;
    }

    try {
      const range = selectionData.range;
      if (!range) {
        modal.showAlert('Invalid selection range', 'warning');
        return;
      }

      // Create new record for the cloze
      const newRecordId = (activeRecord.id || "record") + "/" + createID(6);

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

      modal.showAlert('Cloze created successfully', 'success');
    } catch (error) {
      console.error('Error creating cloze:', error);
      modal.showAlert('Error creating cloze', 'danger');
    }
  }

  private async createExtract() {
    // Get current selection
    const selectionData = get(selection);

    if (!selectionData || !selectionData.isSelected || !selectionData.text) {
      modal.showAlert('Please select text to create an extract', 'warning');
      return;
    }

    // Get active record
    const databaseData = get(database);
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze'
    ) || null;

    if (!activeRecord) {
      modal.showAlert('No active record to create extract', 'warning');
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

      modal.showAlert('Extract created successfully', 'success');
    } catch (error) {
      console.error('Error creating extract:', error);
      modal.showAlert('Error creating extract', 'danger');
    }
  }

  private async flagItem() {
    // Get active record
    const databaseData = get(database);
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
    ) || null;

    if (!activeRecord || !activeRecord.id) {
      modal.showAlert('No active record to flag', 'warning');
      return;
    }

    try {
      // Toggle flagged status
      const isFlagged = !(activeRecord.isFlagged || false);
      await database.updateRecordRemotely(activeRecord.id, { isFlagged });
      
      modal.showAlert(`Item ${isFlagged ? 'flagged' : 'unflagged'} successfully`, 'success');
    } catch (error) {
      console.error('Error flagging item:', error);
      modal.showAlert('Error flagging item', 'danger');
    }
  }

  private async removeItem() {
    // Get active record
    const databaseData = get(database);
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
    ) || null;

    if (!activeRecord || !activeRecord.id) {
      modal.showAlert('No active record to remove', 'warning');
      return;
    }

    try {
      // Remove from database
      await database.removeRecordById(activeRecord.id);
      
      modal.showAlert('Item removed successfully', 'success');
    } catch (error) {
      console.error('Error removing item:', error);
      modal.showAlert('Error removing item', 'danger');
    }
  }

  private async duplicateItem() {
    // Get active record
    const databaseData = get(database);
    const activeRecord = databaseData.items.find(item =>
      item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
    ) || null;

    if (!activeRecord) {
      modal.showAlert('No active record to duplicate', 'warning');
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

      modal.showAlert('Item duplicated successfully', 'success');
    } catch (error) {
      console.error('Error duplicating item:', error);
      modal.showAlert('Error duplicating item', 'danger');
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

      modal.showAlert('Folder created successfully', 'success');
    } catch (error) {
      console.error('Error creating folder:', error);
      modal.showAlert('Error creating folder', 'danger');
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

      modal.showAlert('Text document created successfully', 'success');
    } catch (error) {
      console.error('Error creating text document:', error);
      modal.showAlert('Error creating text document', 'danger');
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