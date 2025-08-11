<script lang="ts">
	import { page } from '$app/stores';

	/* ─────────────── incoming props ─────────────── */
	const {
		title  = 'Neurapath - Evidence-Based Learning Platform',
		description = "Boost your learning with Neurapath's evidence-based platform. Master spaced repetition, incremental reading, and active recall techniques.",
		keywords = 'evidence-based learning, spaced repetition, incremental reading, active recall, learning platform, educational technology',
		ogTitle = 'Neurapath - Evidence-Based Learning Platform',
		ogDescription = "Boost your learning with Neurapath's evidence-based platform. Master spaced repetition, incremental reading, and active recall techniques.",
		ogImage = '/img/preview/og-image.svg',
		ogUrl   = '',
		twitterTitle = 'Neurapath - Evidence-Based Learning Platform',
		twitterDescription = "Boost your learning with Neurapath's evidence-based platform. Master spaced repetition, incremental reading, and active recall techniques.",
		twitterImage = '/img/preview/twitter-image.svg',
		canonicalUrl = '',
		schema = []
	} = $props<{
		title?: string;
		description?: string;
		keywords?: string;
		ogTitle?: string;
		ogDescription?: string;
		ogImage?: string;
		ogUrl?: string;
		twitterTitle?: string;
		twitterDescription?: string;
		twitterImage?: string;
		canonicalUrl?: string;
		schema?: Record<string, any>[];
	}>();

	/* ─────────────── derived URLs ─────────────── */
	/* ✅ one‑argument form */
	let canonicalUrlFinal = $derived(() =>
		canonicalUrl || `https://neurapath.shop${$page.url.pathname}`
	);

	let ogUrlFinal = $derived(() =>
		ogUrl || `https://neurapath.shop${$page.url.pathname}`
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords"    content={keywords} />

	<!-- Open Graph -->
	<meta property="og:title"       content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:type"        content="website" />
	<meta property="og:url"         content={ogUrlFinal} />
	<meta property="og:site_name"   content="Neurapath" />
	{#if ogImage}
		<meta property="og:image"        content={ogImage} />
		<meta property="og:image:width"  content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card"        content="summary_large_image" />
	<meta name="twitter:title"       content={twitterTitle} />
	<meta name="twitter:description" content={twitterDescription} />
	{#if twitterImage}
		<meta name="twitter:image" content={twitterImage} />
	{/if}

	<!-- Canonical -->
	<link rel="canonical" href={canonicalUrlFinal} />

	<!-- Per‑page schema -->
	{#each schema as item}
		<script type="application/ld+json">
			{JSON.stringify(item, null, 2)}
		</script>
	{/each}

	<!-- Global schema -->
	<script type="application/ld+json">
		{JSON.stringify({
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "Neurapath",
			"url": "https://neurapath.shop",
			"description":
				"Evidence-based learning platform implementing spaced repetition and incremental reading"
		}, null, 2)}
	</script>
</svelte:head>