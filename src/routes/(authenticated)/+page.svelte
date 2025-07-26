<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { database } from '$lib/stores/database.store';
	import type { Record } from '$lib/models';
	import SeoHead from '$lib/components/SeoHead.svelte';

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

<SeoHead
	title="Neuraa Dashboard - Evidence-Based Learning"
	description="Access your personalized learning dashboard with spaced repetition cards, incremental reading materials, and progress tracking."
	keywords="learning dashboard, spaced repetition, incremental reading, study progress"
	ogTitle="Neuraa Dashboard - Evidence-Based Learning"
	ogDescription="Access your personalized learning dashboard with spaced repetition cards, incremental reading materials, and progress tracking."
	twitterTitle="Neuraa Dashboard - Evidence-Based Learning"
	twitterDescription="Access your personalized learning dashboard with spaced repetition cards, incremental reading materials, and progress tracking."
	canonicalUrl="https://neurapath.io/dashboard"
	schema={[{
		"@context": "https://schema.org",
		"@type": "EducationalOccupationalProgram",
		"name": "Evidence-Based Learning Techniques",
		"description": "Master learning techniques based on cognitive science research including spaced repetition, incremental reading, and active recall",
		"provider": {
			"@type": "Organization",
			"name": "Neuraa"
		},
		"occupationalCategory": "Education",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		}
	}]}
/>

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
