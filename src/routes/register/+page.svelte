<script lang="ts">
	import AuthForm from '@/components/AuthForm.svelte';
	import SeoHead  from '$lib/components/SeoHead.svelte';
    const { form } = $props<{ form: import('./$types').ActionData | undefined }>();
</script>

<SeoHead
	title="Create a Neurapath account"
	description="Register for Neurapath and unlock evidence‑based learning tools."
	canonicalUrl="https://neurapath.io/register"
/>

<div class="flex h-screen w-full items-center justify-center px-8">
	<!-- start in register mode -->
	<AuthForm form={form} mode="register" id={() => crypto.randomUUID()}/>
</div>
