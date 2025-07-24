<script lang="ts">
  import { onMount } from 'svelte';
  import { database } from '$lib/stores/database.store';
  import { profile } from '$lib/stores/profile.store';
  import { learning } from '$lib/stores/learning.store';
  import { selection } from '$lib/stores/selection.store';
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { modal } from '$lib/stores/modal.store';
  import { ui } from '$lib/stores/ui.store';
  import { auth } from '$lib/stores/auth.store';
  import type { Record } from '$lib/models';

  let authState: { isLoggedIn: boolean; user: { username: string } | null } | undefined;

  // Test database operations
  const testDatabaseOperations = async () => {
    try {
      console.log('Testing database operations...');
      
      // Test adding a record
      const testRecord: Record = {
        id: "test-record",
        contentType: "Extract",
        content: {
          ops: [
            {
              insert: "This is a test record"
            }
          ]
        }
      };
      
      await database.addRecord(testRecord);
      console.log('✓ Added test record');
      
      // Test updating a record
      await database.updateRecordRemotely("test-record", {
        content: {
          ops: [
            {
              insert: "This is an updated test record"
            }
          ]
        }
      });
      console.log('✓ Updated test record');
      
      // Test retrieving a record
      const retrievedRecord = database.getRecordById("test-record");
      console.log('✓ Retrieved test record:', retrievedRecord);
      
      // Test removing a record
      await database.removeRecordById("test-record");
      console.log('✓ Removed test record');
      
      console.log('All database operations completed successfully!');
    } catch (error) {
      console.error('Error testing database operations:', error);
    }
  };

  // Initialize the app with database data
  onMount(async () => {
    try {
      // Set current user ID for database operations
      const unsubscribe = auth.subscribe((state) => {
        authState = state;
      });
      
      let userId = 'demo-user';
      if (authState && authState.isLoggedIn && authState.user) {
        userId = authState.user.username;
      }
      
      database.setCurrentUserId(userId);
      await database.loadDatabase(userId);
      
      // Clean up subscription
      unsubscribe();
      
      console.log('App initialized with database data');
      
      // Run test operations
      // await testDatabaseOperations();
    } catch (error) {
      console.error('Error initializing app:', error);
      // Fallback to default initialization
      database.setCurrentUserId(null);
    }
  });
</script>

<div id="app">
  <h1>Neurapath App</h1>
  <p>Welcome to the Neurapath application. This is a test page to verify the basic functionality of the migrated components.</p>
</div>

<style>
  #app {
    padding: 20px;
    text-align: center;
  }
  
  h1 {
    color: rgb(var(--font-color));
  }
  
  p {
    color: rgb(var(--font-color));
    font-size: var(--font-size);
  }
</style>
