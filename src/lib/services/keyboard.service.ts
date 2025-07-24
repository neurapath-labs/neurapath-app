import { profile } from '$lib/stores/profile.store';
import { modal } from '$lib/stores/modal.store';
import { selection } from '$lib/stores/selection.store';
import { database } from '$lib/stores/database.store';
import { createID } from '$lib/utils/helpers';
import type { Shortcut, Record } from '$lib/models';
import type { SelectionState } from '$lib/stores/selection.store';
import type { Database } from '$lib/stores/database.store';
import type { Profile } from '$lib/models';

class KeyboardService {
  private shortcuts: Shortcut[] = [];
  private unsubscribeProfile: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Subscribe to profile changes to get updated shortcuts
    this.unsubscribeProfile = profile.subscribe(($profile: Profile) => {
      this.shortcuts = $profile.shortcuts || [];
    });

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
    switch (event) {
      // Spotlight search
      case 'input-spotlight-toggle':
        modal.openSpotlightSearchModal();
        break;

      // Create cloze
      case 'input-create-cloze':
        await this.createCloze();
        break;

      // Create image occlusion
      case 'input-create-occlusion':
        modal.openOcclusionCreateModal();
        break;

      // Create separate occlusions
      case 'input-create-occlusion-separate':
        // Implementation would depend on context
        modal.showAlert('Create separate occlusions functionality not yet implemented', 'warning');
        break;

      // Show answer for occlusion
      case 'learning-show-answer':
        // This is handled in LearningMode.svelte
        break;

      // Create extract from selection
      case 'input-create-extract':
        await this.createExtract();
        break;

      // Summarize selected text with AI
      case 'input-text-summarize':
        modal.openSummaryModal();
        break;

      // Flag item
      case 'input-flag-item':
        await this.flagItem();
        break;

      // Remove selected item
      case 'input-remove-item':
        await this.removeItem();
        break;

      // Rename selected item
      case 'input-rename-item':
        // Implementation would depend on context
        modal.showAlert('Rename item functionality not yet implemented', 'warning');
        break;

      // Duplicate selected item
      case 'input-duplicate-item':
        await this.duplicateItem();
        break;

      // Create folder
      case 'input-create-folder':
        await this.createFolder();
        break;

      // Create text document
      case 'input-create-text':
        await this.createTextDocument();
        break;

      // Grade items
      case 'input-grade-item1':
        // These are handled in LearningMode.svelte
        break;
      case 'input-grade-item2':
        break;
      case 'input-grade-item3':
        break;
      case 'input-grade-item4':
        break;
      case 'input-grade-item5':
        break;

      // Default case
      default:
        console.log('Unhandled shortcut event:', event);
        break;
    }
  }

  private async createCloze() {
    // Get current selection
    let selectionData: SelectionState | null = null;
    const unsubscribe = selection.subscribe(($selection: SelectionState) => {
      selectionData = $selection;
    });
    unsubscribe();

    if (!selectionData || !selectionData.isSelected || !selectionData.text) {
      modal.showAlert('Please select text to create a cloze', 'warning');
      return;
    }

    // Get active record
    let activeRecord: Record | null = null;
    const unsubscribeDb = database.subscribe(($database: Database) => {
      // For now, just get the first record with content
      activeRecord = $database.items.find((item: Record) =>
        item.contentType === 'Extract' || item.contentType === 'Cloze'
      ) || null;
    });
    unsubscribeDb();

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
      
      // Get profile data for cloze highlight color
      let profileData: Profile | null = null;
      const unsubscribeProfile = profile.subscribe(($profile: Profile) => {
        profileData = $profile;
      });
      unsubscribeProfile();

      const newRecord: Record = {
        id: newRecordId,
        contentType: "Cloze",
        content: {
          "ops": [
            {
              "insert": selectionData!.text
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
    let selectionData: SelectionState | null = null;
    const unsubscribe = selection.subscribe(($selection: SelectionState) => {
      selectionData = $selection;
    });
    unsubscribe();

    if (!selectionData || !selectionData.isSelected || !selectionData.text) {
      modal.showAlert('Please select text to create an extract', 'warning');
      return;
    }

    // Get active record
    let activeRecord: Record | null = null;
    const unsubscribeDb = database.subscribe(($database: Database) => {
      // For now, just get the first record with content
      activeRecord = $database.items.find((item: Record) =>
        item.contentType === 'Extract' || item.contentType === 'Cloze'
      ) || null;
    });
    unsubscribeDb();

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
              "insert": selectionData!.text
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
    let activeRecord: Record | null = null;
    const unsubscribeDb = database.subscribe(($database: Database) => {
      // For now, just get the first record with content
      activeRecord = $database.items.find((item: Record) =>
        item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
      ) || null;
    });
    unsubscribeDb();

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
    let activeRecord: Record | null = null;
    const unsubscribeDb = database.subscribe(($database: Database) => {
      // For now, just get the first record with content
      activeRecord = $database.items.find((item: Record) =>
        item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
      ) || null;
    });
    unsubscribeDb();

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
    let activeRecord: Record | null = null;
    const unsubscribeDb = database.subscribe(($database: Database) => {
      // For now, just get the first record with content
      activeRecord = $database.items.find((item: Record) =>
        item.contentType === 'Extract' || item.contentType === 'Cloze' || item.contentType === 'Occlusion'
      ) || null;
    });
    unsubscribeDb();

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
    if (this.unsubscribeProfile) {
      this.unsubscribeProfile();
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }
}

// Export singleton instance
export const keyboardService = new KeyboardService();