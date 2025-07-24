import type { Record } from '$lib/models';
import { database } from '$lib/stores/database.store';
import { modal } from '$lib/stores/modal.store';

// Function to export database to JSON
export const exportDatabaseToJSON = async (): Promise<boolean> => {
  try {
    // Get current database state
    let databaseState: { items: Record[] } | null = null;
    const unsubscribe = database.subscribe((state) => {
      databaseState = state;
    });
    unsubscribe();

    if (!databaseState) {
      throw new Error('Failed to get database state');
    }

    // Create JSON data
    const jsonData = JSON.stringify(databaseState, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `evecloud-database-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    URL.revokeObjectURL(url);
    
    modal.showAlert('Database exported successfully!', 'success');
    return true;
  } catch (error) {
    console.error('Error exporting database:', error);
    modal.showAlert('Failed to export database. Please try again.', 'danger');
    return false;
  }
};

// Function to export database to CSV
export const exportDatabaseToCSV = async (): Promise<boolean> => {
  try {
    // Get current database state
    let databaseState: { items: Record[] } | null = null;
    const unsubscribe = database.subscribe((state) => {
      databaseState = state;
    });
    unsubscribe();

    if (!databaseState) {
      throw new Error('Failed to get database state');
    }

    // Create CSV header
    const headers = ['id', 'contentType', 'content', 'url', 'priority', 'repetition', 'totalRepetitionCount', 'isFlagged', 'interval', 'efactor', 'dueDate'];
    const csvRows = [headers.join(',')];

    // Add data rows
    databaseState.items.forEach(item => {
      const row = [
        `"${item.id || ''}"`,
        `"${item.contentType || ''}"`,
        `"${typeof item.content === 'object' ? JSON.stringify(item.content) : item.content || ''}"`,
        `"${item.url || ''}"`,
        `"${item.priority !== undefined ? item.priority : ''}"`,
        `"${item.repetition !== undefined ? item.repetition : ''}"`,
        `"${item.totalRepetitionCount !== undefined ? item.totalRepetitionCount : ''}"`,
        `"${item.isFlagged !== undefined ? item.isFlagged : ''}"`,
        `"${item.interval !== undefined ? item.interval : ''}"`,
        `"${item.efactor !== undefined ? item.efactor : ''}"`,
        `"${item.dueDate || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    // Create CSV data
    const csvData = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `evecloud-database-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    URL.revokeObjectURL(url);
    
    modal.showAlert('Database exported successfully!', 'success');
    return true;
  } catch (error) {
    console.error('Error exporting database:', error);
    modal.showAlert('Failed to export database. Please try again.', 'danger');
    return false;
  }
};

// Function to import database from JSON
export const importDatabaseFromJSON = async (file: File): Promise<boolean> => {
  try {
    // Read file content
    const content = await readFileContent(file);
    const importedData = JSON.parse(content);
    
    // Validate data structure
    if (!importedData.items || !Array.isArray(importedData.items)) {
      throw new Error('Invalid data format: missing items array');
    }
    
    // Update database store
    database.set(importedData);
    
    modal.showAlert('Database imported successfully!', 'success');
    return true;
  } catch (error) {
    console.error('Error importing database:', error);
    modal.showAlert(`Failed to import database: ${error.message || 'Unknown error'}`, 'danger');
    return false;
  }
};

// Function to import database from CSV
export const importDatabaseFromCSV = async (file: File): Promise<boolean> => {
  try {
    // Read file content
    const content = await readFileContent(file);
    const lines = content.split('\n');
    
    if (lines.length < 2) {
      throw new Error('Invalid CSV format: missing data');
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
    
    // Parse data rows
    const items: Record[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(value => value.replace(/"/g, '').trim());
      const item: Partial<Record> = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (value === undefined) return;
        
        switch (header) {
          case 'id':
            item.id = value;
            break;
          case 'contentType':
            if (['Folder', 'Cloze', 'Extract', 'Image', 'Occlusion'].includes(value)) {
              item.contentType = value as 'Folder' | 'Cloze' | 'Extract' | 'Image' | 'Occlusion';
            }
            break;
          case 'content':
            try {
              item.content = JSON.parse(value);
            } catch {
              item.content = value;
            }
            break;
          case 'url':
            item.url = value || undefined;
            break;
          case 'priority':
            item.priority = value ? parseInt(value, 10) : undefined;
            break;
          case 'repetition':
            item.repetition = value ? parseInt(value, 10) : undefined;
            break;
          case 'totalRepetitionCount':
            item.totalRepetitionCount = value ? parseInt(value, 10) : undefined;
            break;
          case 'isFlagged':
            item.isFlagged = value === 'true';
            break;
          case 'interval':
            item.interval = value ? parseFloat(value) : undefined;
            break;
          case 'efactor':
            item.efactor = value ? parseFloat(value) : undefined;
            break;
          case 'dueDate':
            item.dueDate = value || undefined;
            break;
        }
      });
      
      // Only add items with required fields
      if (item.id && item.contentType) {
        items.push(item as Record);
      }
    }
    
    // Update database store
    database.set({ items });
    
    modal.showAlert('Database imported successfully!', 'success');
    return true;
  } catch (error) {
    console.error('Error importing database:', error);
    modal.showAlert(`Failed to import database: ${error.message || 'Unknown error'}`, 'danger');
    return false;
  }
};

// Helper function to read file content
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
};