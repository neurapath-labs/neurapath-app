<script lang="ts">
  import { auth } from '$lib/stores/auth.store';
  import { database } from '$lib/stores/database.store';
  import { learning } from '$lib/stores/learning.store';
  import { profile } from '$lib/stores/profile.store';
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { ui } from '$lib/stores/ui.store';
  import { modal } from '$lib/stores/modal.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';
  import { createID } from '$lib/utils/helpers';
  
  let learningMode = false;
  let databaseItems: Record[] = [];
  let profileData: any = {};
  let lastRightClickedItemID: string | null = null;
  let expandedFolders: Set<string> = new Set();
  let activeItemId: string | null = null;
  let dueCount = 0;
  let folderCount = 0;
  let extractCount = 0;
  let clozeCount = 0;
  let occlusionCount = 0;
  
  // Subscribe to database changes
  const unsubscribe = database.subscribe(($database) => {
    databaseItems = $database.items;
    
    // Calculate counts
    dueCount = $database.items.filter(item =>
      (item.contentType === 'Cloze' || item.contentType === 'Extract' || item.contentType === 'Occlusion') &&
      item.dueDate && new Date(item.dueDate) <= new Date()
    ).length;
    
    folderCount = $database.items.filter(item => item.contentType === 'Folder').length;
    extractCount = $database.items.filter(item => item.contentType === 'Extract').length;
    clozeCount = $database.items.filter(item => item.contentType === 'Cloze').length;
    occlusionCount = $database.items.filter(item => item.contentType === 'Occlusion').length;
  });
  
  // Subscribe to profile changes
  const unsubscribeProfile = profile.subscribe(($profile) => {
    profileData = $profile;
  });
  
  // Subscribe to learning mode changes
  const unsubscribeLearning = learning.subscribe(($learning) => {
    learningMode = $learning.isInLearningMode;
  });
  
  // Subscribe to UI changes
  const unsubscribeUI = ui.subscribe(($ui) => {
    expandedFolders = $ui.expandedFolders;
    activeItemId = $ui.activeItemId;
  });
  
  // Clean up subscriptions
  onDestroy(() => {
    unsubscribe();
    unsubscribeProfile();
    unsubscribeLearning();
    unsubscribeUI();
  });
  
  const handleLogout = async () => {
    await auth.logout();
    // Redirect to login page
    window.location.href = '/login';
  };
  
  const toggleLearningMode = () => {
    learning.toggleLearningMode();
  };
  
  // Function to render the folder structure
  interface TreeNode {
    [key: string]: TreeNode | Record | undefined;
    _item?: Record;
  }
  
  const renderFolders = (items: Record[]): TreeNode => {
    // Create a tree structure from the flat items array
    const tree: TreeNode = {};
    
    items.forEach(item => {
      const parts = item.id.split('/');
      let current: TreeNode = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {};
        }
        
        if (index === parts.length - 1) {
          (current[part] as TreeNode)._item = item;
        }
        
        current = current[part] as TreeNode;
      });
    });
    
    return tree;
  };
  
  // Recursive function to render the tree structure
  const renderTree = (tree: TreeNode, path: string[] = []): string => {
    return Object.keys(tree)
      .filter(key => key !== '_item')
      .map(key => {
        const currentPath = [...path, key];
        const fullPath = currentPath.join('/');
        const node = tree[key] as TreeNode;
        const item = node._item;
        
        // Check if this folder should be expanded
        const isExpanded = expandedFolders.has(fullPath);
        
        return `
          <div class="menuSubItem">
            <p
              data-id="${fullPath}"
              class="${item ? item.contentType.toLowerCase() : 'folder'} ${activeItemId === fullPath ? 'active' : ''}"
              on:click={() => handleMenuItemClick('${fullPath}')}
              on:contextmenu={(e) => handleContextMenu(e, '${fullPath}')}
            >
              ${item && item.contentType === 'Folder' ?
                `<img class="threeIcon" src="/img/${isExpanded ? 'folderopen' : 'folderclose'}.svg" alt="Folder icon">` :
                item && item.contentType === 'Cloze' ?
                  '<img class="threeIcon" src="/img/cloze.svg" alt="Cloze icon">' :
                  item && item.contentType === 'Extract' ?
                    '<img class="threeIcon" src="/img/extract.svg" alt="Extract icon">' :
                    item && item.contentType === 'Occlusion' ?
                      '<img class="threeIcon" src="/img/occlusion2.svg" alt="Occlusion icon">' :
                      '<img class="threeIcon" src="/img/folderclose.svg" alt="Folder icon">'}
              ${key}
              ${item && item.isFlagged ? '<span class="flag-icon">🚩</span>' : ''}
            </p>
            ${Object.keys(node).filter(k => k !== '_item').length > 0 && isExpanded ?
              `<div class="menuSubItemChildren">
                ${renderTree(node, currentPath)}
              </div>` : ''}
          </div>
        `;
      }).join('');
  };
  
  // Function to handle menu item clicks
  const handleMenuItemClick = (id: string) => {
    console.log('Menu item clicked:', id);
    // TODO: Implement item selection logic
    // This would typically involve updating the main content area with the selected item
    
    // Get the item from the database
    const item = databaseItems.find(i => i.id === id);
    
    if (item) {
      if (item.contentType === 'Folder') {
        // Toggle folder expanded state
        ui.toggleFolderExpanded(id);
      } else {
        // Set as active item
        ui.setActiveItemId(id);
      }
    }
  };
  
  // Function to handle context menu
  const handleContextMenu = (e: MouseEvent, id: string) => {
    e.preventDefault();
    lastRightClickedItemID = id;
    contextmenu.showContextMenu(e.clientX, e.clientY, id, 'sidebar-item');
  };
  
  // Function to create a new folder
  const createFolder = async () => {
    const id = createID(6);
    try {
      const newFolder: Record = {
        id: id,
        contentType: 'Folder'
      };
      await database.addRecord(newFolder);
      console.log('Create folder with ID:', id);
      modal.showAlert('Folder created successfully', 'success');
    } catch (error) {
      console.error('Error creating folder:', error);
      modal.showAlert('Error creating folder', 'danger');
    }
  };
  
  // Function to create a new text item
  const createText = async () => {
    const id = createID(6);
    try {
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
      console.log('Create text with ID:', id);
      modal.showAlert('Text created successfully', 'success');
    } catch (error) {
      console.error('Error creating text:', error);
      modal.showAlert('Error creating text', 'danger');
    }
  };
  
  // Function to remove an item
  const removeItem = async () => {
    if (lastRightClickedItemID) {
      try {
        await database.removeRecordById(lastRightClickedItemID);
        console.log('Remove item with ID:', lastRightClickedItemID);
        modal.showAlert('Item removed successfully', 'success');
      } catch (error) {
        console.error('Error removing item:', error);
        modal.showAlert('Error removing item', 'danger');
      }
    }
  };
  
  // Function to rename an item
  const renameItem = async () => {
    if (lastRightClickedItemID) {
      // In a real implementation, we would show a prompt to get the new name
      // For now, we'll just demonstrate the update functionality
      try {
        // Get the current item
        const currentItem = databaseItems.find(item => item.id === lastRightClickedItemID);
        if (currentItem) {
          // For demonstration, we'll just update a property
          // In a real app, we would update the id or other properties
          await database.updateRecordRemotely(lastRightClickedItemID, {
            ...currentItem,
            // Example update - in a real app this would be the new name
          });
          console.log('Rename item with ID:', lastRightClickedItemID);
          modal.showAlert('Item renamed successfully', 'success');
        }
      } catch (error) {
        console.error('Error renaming item:', error);
        modal.showAlert('Error renaming item', 'danger');
      }
    }
  };
  
  // Function to duplicate an item
  const duplicateItem = async () => {
    if (lastRightClickedItemID) {
      try {
        // Get the current item
        const currentItem = databaseItems.find(item => item.id === lastRightClickedItemID);
        if (currentItem) {
          // Create a new item with a new ID
          const newItem = {
            ...currentItem,
            id: createID(6) // Generate a new ID
          };
          await database.addRecord(newItem);
          console.log('Duplicate item with ID:', lastRightClickedItemID);
          modal.showAlert('Item duplicated successfully', 'success');
        }
      } catch (error) {
        console.error('Error duplicating item:', error);
        modal.showAlert('Error duplicating item', 'danger');
      }
    }
  };
  
  // Function to flag an item
  const flagItem = async () => {
    if (lastRightClickedItemID) {
      try {
        await database.updateRecordRemotely(lastRightClickedItemID, {
          isFlagged: true
        });
        console.log('Flag item with ID:', lastRightClickedItemID);
        modal.showAlert('Item flagged successfully', 'success');
      } catch (error) {
        console.error('Error flagging item:', error);
        modal.showAlert('Error flagging item', 'danger');
      }
    }
  };
  
  // Function to unflag an item
  const unflagItem = async () => {
    if (lastRightClickedItemID) {
      try {
        await database.updateRecordRemotely(lastRightClickedItemID, {
          isFlagged: false
        });
        console.log('Unflag item with ID:', lastRightClickedItemID);
        modal.showAlert('Item unflagged successfully', 'success');
      } catch (error) {
        console.error('Error unflagging item:', error);
        modal.showAlert('Error unflagging item', 'danger');
      }
    }
  };
  
  // Function to postpone an item
  const postponeItem = async () => {
    if (lastRightClickedItemID) {
      try {
        // Calculate new due date (postpone by 1 day)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        await database.updateRecordRemotely(lastRightClickedItemID, {
          dueDate: tomorrow.toISOString()
        });
        console.log('Postpone item with ID:', lastRightClickedItemID);
        modal.showAlert('Item postponed successfully', 'success');
      } catch (error) {
        console.error('Error postponing item:', error);
        modal.showAlert('Error postponing item', 'danger');
      }
    }
  };
  
  // Function to import database
  const importDatabase = async () => {
    try {
      // In a real implementation, we would read from a file
      // For now, we'll just demonstrate the load functionality
      // Use a default user ID since we don't have access to auth state here
      await database.loadDatabase('demo-user');
      console.log('Import database');
      modal.showAlert('Database imported successfully', 'success');
    } catch (error) {
      console.error('Error importing database:', error);
      modal.showAlert('Error importing database', 'danger');
    }
  };
  
  // Function to export database
  const exportDatabase = async () => {
    try {
      // Use a default user ID since we don't have access to auth state here
      await database.saveDatabase('demo-user');
      console.log('Export database');
      modal.showAlert('Database exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting database:', error);
      modal.showAlert('Error exporting database', 'danger');
    }
  };
  
  // Function to render explorer
  const renderExplorer = () => {
    ui.openExplorer();
  };
  
  // Function to render flagged items
  const renderFlagged = () => {
    ui.openFlagged();
  };
  
  // Function to render statistics
  const renderStatistics = () => {
    ui.openStatistics();
  };
  
  // Function to render databases
  const renderDatabases = () => {
    ui.openDatabases();
  };
  
  // Function to expand all parents to ID
  const expandAllParentsToID = (id: string) => {
    ui.expandAllParentsToId(id);
  };
  
  // Function to highlight item in sidebar by ID
  const highlightItemInSidebarByID = (id: string) => {
    ui.setActiveItemId(id);
  };
</script>

<aside id="sidebar-left">
  <div id="logo-area">
    <img src="/img/logo.svg" alt="Evecloud logo">
    <div id="sidebar-title">EVE</div>
    <div id="sidebar-subtitle">Made in Sweden.</div>
    <div id="sidebar-saved">Last saved:
      <div id="sidebar-last-saved">-</div>
    </div>
    <br>
    <div id="sidebar-due">Due today:
      <div id="sidebar-due-items">{dueCount}</div>
    </div>
  </div>
  <div
    id="learning-button"
    class={learningMode ? "stop-learning-button" : "start-learning-button"}
    on:click={toggleLearningMode}
  >
    {learningMode ? "Stop learning!" : "Engage!"}
  </div>
  <div id="menu">
    <div id="header-buttons">

      <div class="sidebar-item" id="header-settings-button">
        <img height="42px" width="42px" src="/img/user.svg" alt="Settings icon.">
        <span>Settings</span>
      </div>

      <div class="sidebar-item" id="header-darkmode-button">
        <img height="42px" width="42px" src="/img/night-mode.svg" alt="Darkmode icon.">
        <span id="darkmode-text">Dark mode</span>
      </div>

      <div class="sidebar-item" id="header-database-button">
        <img height="42px" width="42px" src="/img/database.svg" alt="Database icon.">
        <span id="database-text">Shared databases</span>
      </div>

      <div class="sidebar-item" id="header-explorer-button" on:click={renderExplorer}>
        <img height="42px" width="42px" src="/img/find.svg" alt="Item explorer icon.">
        <span id="explorer-text">Item explorer</span>
      </div>

      <div class="sidebar-item" id="header-flagged-button" on:click={renderFlagged}>
        <img height="42px" width="42px" src="/img/unflag.svg" alt="Flagged icon.">
        <span id="flag-text">Flagged items</span>
      </div>

      <div class="sidebar-item" id="header-statistics-button" on:click={renderStatistics}>
        <img height="42px" width="42px" src="/img/statistics.svg" alt="Statistics icon.">
        <span id="statistics-text">Statistics</span>
      </div>
      
      <div class="sidebar-item" id="header-logout-button" on:click={handleLogout}>
        <img height="42px" width="42px" src="/img/lock.svg" alt="Logout icon.">
        <span id="logout-text">Logout</span>
      </div>
    </div>
  </div>
  <div id="content-structure">
    {#if $database.items.length > 0}
      {@html renderTree(renderFolders($database.items))}
    {/if}
  </div>
</aside>

<style>
  #sidebar-left {
    grid-area: sidebar;
    width: min-content;
    height: 100vh;
    overflow: auto;
    background: rgba(var(--background-color_sidebar), 1);
    color: rgb(var(--font-color));
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: min-content min-content min-content 1fr;
    align-content: start;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  #logo-area {
    display: grid;
    grid-template-columns: 50px 1fr;
    grid-template-rows: 50px 1fr;
    grid-template-areas: "img logo""slogan slogan";
    grid-gap: 10px;
    padding: 10px;
    opacity: var(--zen-opacity);
  }

  #logo-area > img {
    grid-area: img;
    width: 50px;
    height: 50px;
    fill: red;
  }

  #sidebar-title {
    grid-area: logo;
    width: 50px;
    height: 50px;
    font-style: normal;
    font-weight: bold;
    font-size: 24px;
    line-height: 56px;
    text-transform: capitalize;
    color: rgb(var(--text-color));
  }

  #logo-area > #sidebar-subtitle {
    white-space: nowrap;
    grid-area: slogan;
    font-family: Poppins;
    font-style: italic;
    font-weight: normal;
    font-size: 12px;
    color: rgb(var(--text-color));
  }

  #sidebar-saved,
  #sidebar-last-saved {
    display: inline-block;
    white-space: nowrap;
    font-family: Poppins;
    font-style: italic;
    font-weight: normal;
    font-size: 12px;
    color: var(--text-color);
  }

  #sidebar-due,
  #sidebar-due-items {
    display: inline-block;
    white-space: nowrap;
    font-family: Poppins;
    font-style: italic;
    font-weight: normal;
    font-size: 12px;
    color: rgb(var(--text-color));
  }

  .start-learning-button {
    white-space: nowrap;
    font-size: 14px;
    padding: 10px 12px;
    margin: 0px 5px;
    border-radius: 5px;
    background-color: rgb(var(--background-color_button));
    color: rgb(var(--font-color_button));
    opacity: var(--zen-opacity);
  }

  .start-learning-button:hover {
    cursor: pointer;
    background-color: rgb(var(--background-color_button-hover));
  }

  .stop-learning-button {
    white-space: nowrap;
    font-size: 14px;
    padding: 10px 12px;
    margin: 0px 5px;
    border-radius: 5px;
    background-color: rgba(255, 101, 101, 0.719);
    color: white;
    opacity: var(--zen-opacity);
  }

  .stop-learning-button:hover {
    cursor: pointer;
    background-color: rgba(255, 129, 129, 0.719);
  }

  #header-buttons {
    grid-area: darkmode;
    justify-self: end;
    display: grid;
    grid-template-rows: min-content min-content min-content min-content min-content min-content;
    padding: 12px;
    grid-gap: 8px;
    background-color: rgb(var(--background-color_sidebar));
    border-bottom: 0px solid rgb(var(--background-color));
  }

  #content-structure {
    padding: 15px 20px 15px 5px;
    font-size: 14px;
    opacity: var(--zen-opacity);
  }

  #sidebar:hover #content-structure {
    opacity: 1 !important;
  }

  .sidebar-item {
    white-space: nowrap;
    font-size: 16px;
    color: rgb(var(--font-color));
    position: relative;
  }

  .sidebar-item > img {
    width: 16px;
    height: 16px;
  }

  .sidebar-item:hover {
    cursor: pointer;
    font-weight: 500;
  }
</style>