<script lang="ts">
	/* ---------- framework / stores ---------- */
	import { onMount }   from 'svelte';
	import { database }  from '$lib/stores/database.store';

	/* ---------- types & components ---------- */
	import SeoHead        from '$lib/components/SeoHead.svelte';

	/* ---------- route data (provided by +page.ts load) ---------- */
	const { data } = $props<{ data: { user: { name: string } } }>();

	/* ---------- local state (runes) ---------- */
	let loaded: boolean        = $state(false);
	let initError: string|null = $state(null);

	/* ---------- initialise DB once on mount ---------- */
	onMount(async () => {
		try {
			const username = data.user.name;

			// Tell the DB store which user we’re dealing with
			database.setCurrentUserId(username);

			// Pull the entire DB blob from the Worker/edge
			await database.loadDatabase(username);

			loaded = true;
		} catch (err) {
			console.error('Failed to initialise DB', err);
			database.setCurrentUserId(null);
			initError = 'Failed to load your database. Working in anonymous mode.';
		}
	});
</script>

<SeoHead
	title="Neurapath Dashboard - Evidence-Based Learning"
	description="Access your personalized learning dashboard with spaced repetition cards, incremental reading materials, and progress tracking."
	keywords="learning dashboard, spaced repetition, incremental reading, study progress"
	ogTitle="Neurapath Dashboard - Evidence-Based Learning"
	ogDescription="Access your personalized learning dashboard with spaced repetition cards, incremental reading materials, and progress tracking."
	twitterTitle="Neurapath Dashboard - Evidence-Based Learning"
	twitterDescription="Access your personalized learning dashboard with spaced repetition cards, incremental reading materials, and progress tracking."
	canonicalUrl="https://app.neurapath.shop/dashboard"
	schema={[
		{
			"@context": "https://schema.org",
			"@type": "EducationalOccupationalProgram",
			"name": "Evidence-Based Learning Techniques",
			"description": "Master learning techniques based on cognitive science research including spaced repetition, incremental reading, and active recall",
			"provider": { "@type": "Organization", "name": "Neurapath" },
			"occupationalCategory": "Education",
			"offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
		}
	]}
/>
