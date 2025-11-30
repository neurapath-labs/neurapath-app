<script lang="ts">
	import AuthForm from '@/components/AuthForm.svelte';
	import SeoHead  from '$lib/components/SeoHead.svelte';
    const { form } = $props<{ form: import('./$types').ActionData | undefined }>();
</script>

<SeoHead
	title="Create a Neurapath account"
	description="Register for Neurapath and unlock evidence‑based learning tools."
	canonicalUrl="https://app.neurapath.shop/register"
/>

<div class="flex h-screen w-full items-center justify-center px-8 bg-[rgb(var(--background-color))] text-[rgb(var(--font-color))]">
	<!-- start in register mode -->
	<AuthForm form={form} mode="register" id={() => crypto.randomUUID()}/>
</div>
