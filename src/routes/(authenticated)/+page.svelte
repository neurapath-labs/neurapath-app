<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { database } from '$lib/stores/database.store';
	import type { Record } from '$lib/models';

	/* -------------------------------------
	   Grab authenticated user from parent
	------------------------------------- */
	export let data: { user: { username: string } };

	/* -------------------------------------
	   Demo CRUD flow on mount
	------------------------------------- */
	onMount(async () => {
		try {
			const username = data.user.username;

			// Tell the store which user we’re dealing with
			database.setCurrentUserId(username);

			// Pull the entire DB blob from the Worker
			await database.loadDatabase(username);

			/* -------------------------------------------------
			   OPTIONAL: quick smoke‑test of CRUD operations
			 ------------------------------------------------- */
			/*
			const testRecord: Record = {
				id: crypto.randomUUID(),
				contentType: 'Extract',
				content: { ops: [{ insert: 'This is a test record' }] }
			};

			await database.addRecord(testRecord);
			await database.updateRecordRemotely(testRecord.id, {
				content: { ops: [{ insert: 'Updated record' }] }
			});
			console.log('Retrieved', database.getRecordById(testRecord.id));
			await database.removeRecordById(testRecord.id);
			*/
		} catch (err) {
			console.error('Failed to initialise DB', err);
			// fall back to anon mode
			database.setCurrentUserId(null);
		}
	});
</script>

<div id="app">
	<h1>Neurapath</h1>
	<p>Welcome {data.user.username}! Your private database is now loaded.</p>
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
