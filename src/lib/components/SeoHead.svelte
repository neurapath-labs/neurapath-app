<script lang="ts">
  import { page } from '$app/stores';

  export let title: string = 'Neuraa - Evidence-Based Learning Platform';
  export let description: string = 'Boost your learning with Neuraa\'s evidence-based platform. Master spaced repetition, incremental reading, and active recall techniques.';
  export let keywords: string = 'evidence-based learning, spaced repetition, incremental reading, active recall, learning platform, educational technology';
  export let ogTitle: string = 'Neuraa - Evidence-Based Learning Platform';
  export let ogDescription: string = 'Boost your learning with Neuraa\'s evidence-based platform. Master spaced repetition, incremental reading, and active recall techniques.';
  export let ogImage: string = '/img/preview/og-image.svg';
  export let ogUrl: string = '';
  export let twitterTitle: string = 'Neuraa - Evidence-Based Learning Platform';
  export let twitterDescription: string = 'Boost your learning with Neuraa\'s evidence-based platform. Master spaced repetition, incremental reading, and active recall techniques.';
  export let twitterImage: string = '/img/preview/twitter-image.svg';
  export let canonicalUrl: string = '';
  export let schema: Record<string, any>[] = [];
  
  // Generate canonical URL if not provided
  $: canonicalUrlFinal = canonicalUrl || `https://neurapath.io${$page.url.pathname}`;
  
  // Generate OG URL if not provided
  $: ogUrlFinal = ogUrl || `https://neurapath.io${$page.url.pathname}`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords} />
  
  <!-- Open Graph -->
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={ogDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={ogUrlFinal} />
  <meta property="og:site_name" content="Neuraa" />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
  {/if}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={twitterTitle} />
  <meta name="twitter:description" content={twitterDescription} />
  {#if twitterImage}
    <meta name="twitter:image" content={twitterImage} />
  {/if}
  
  <!-- Canonical URL -->
  <link rel="canonical" href={canonicalUrlFinal} />
  
  <!-- Schema Markup -->
  {#each schema as item}
    <script type="application/ld+json">
      {JSON.stringify(item, null, 2)}
    </script>
  {/each}
  
  <!-- Base schema for all pages -->
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Neuraa",
      "url": "https://neurapath.io",
      "description": "Evidence-based learning platform implementing spaced repetition and incremental reading"
    }, null, 2)}
  </script>
</svelte:head>