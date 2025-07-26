<script lang="ts">
  import LoginModal from '$lib/components/modals/LoginModal.svelte';
  import SeoHead from '$lib/components/SeoHead.svelte';
  // SvelteKit injects `form` for us so we can show server-side errors
  export let form: import('./$types').ActionData | undefined;
</script>

<SeoHead
  title="Login to Neuraa - Evidence-Based Learning Platform"
  description="Sign in to your Neuraa account to access your evidence-based learning tools and study materials."
  keywords="login, learning platform, study account, spaced repetition login"
  ogTitle="Login to Neuraa - Evidence-Based Learning Platform"
  ogDescription="Sign in to your Neuraa account to access your evidence-based learning tools and study materials."
  twitterTitle="Login to Neuraa - Evidence-Based Learning Platform"
  twitterDescription="Sign in to your Neuraa account to access your evidence-based learning tools and study materials."
  canonicalUrl="https://neurapath.io/login"
/>

<LoginModal {form} />