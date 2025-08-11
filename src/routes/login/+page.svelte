<svelte:options runes />

<script lang="ts">
	import AuthForm from '@/components/AuthForm.svelte';
	import SeoHead  from '$lib/components/SeoHead.svelte';
  const { form } = $props<{ form: import('./$types').ActionData | undefined }>();
</script>

<SeoHead
	title="Login to Neurapath"
	description="Sign in to your Neurapath account."
	canonicalUrl="https://neurapath.shop/login"
/>

<div class="flex h-screen w-full items-center justify-center px-8">
	<AuthForm form={form} mode="login" id={() => crypto.randomUUID()} />
</div>
