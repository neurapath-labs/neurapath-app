<script lang="ts">
  import AuthForm from "@/components/AuthForm.svelte";
  import SeoHead from '$lib/components/SeoHead.svelte';
  const { form } = $props<{ form: import('./$types').ActionData | undefined }>();
</script>

<SeoHead
  title="Login to Neurapath - Evidence-Based Learning Platform"
  description="Sign in to your Neurapath account to access your evidence-based learning tools and study materials."
  keywords="login, learning platform, study account, spaced repetition login"
  ogTitle="Login to Neurapath - Evidence-Based Learning Platform"
  ogDescription="Sign in to your Neurapath account to access your evidence-based learning tools and study materials."
  twitterTitle="Login to Neurapath - Evidence-Based Learning Platform"
  twitterDescription="Sign in to your Neurapath account to access your evidence-based learning tools and study materials."
  canonicalUrl="https://neurapath.io/login"
/>

<!-- <LoginModal {form} /> -->


<div class="flex h-screen w-full items-center justify-center px-8">
	<AuthForm {form} />
</div>
