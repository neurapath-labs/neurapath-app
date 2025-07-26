<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	export let form: { error?: string } | undefined;

	let username = '';
	let password = '';
</script>

<!-- modal wrapper -->
<div
	class="fixed left-1/2 top-1/2 z-10 w-[400px] h-[600px] max-h-[600px] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded border bg-[rgb(var(--background-color_modalbox))] p-8 text-[rgb(var(--font-color))] grid"
>
	<form method="POST" action="?/login" class="contents">
		<!-- header -->
		<div class="mb-2 grid place-items-center gap-0 text-center text-2xl">
			<img src="/img/logo/logo.svg" alt="Neuraa logo" class="w-[72px]" />
			<span class="whitespace-nowrap">Neuraa</span>
		</div>

		<!-- intro text -->
		<div class="mb-2 text-justify text-base">
			Welcome aboard! Neuraa is specifically tailored for effective studying.
			<u>New user:</u> enter a username and password then press login to create a new
			account. <u>Existing user:</u> enter your username and password below.
		</div>

		<!-- error -->
		{#if form?.error}
			<p class="mb-2 text-sm text-red-500" role="alert">{form.error}</p>
		{/if}

		<!-- username / password -->
		<Input
			id="modalbox-login-username"
			name="username"
			class="mb-0"
			placeholder="Username..."
			bind:value={username}
			required
			autocomplete="username"
		/>

		<Input
			id="modalbox-login-password"
			name="password"
			type="password"
			class="mb-0"
			placeholder="Password..."
			bind:value={password}
			required
			autocomplete="current-password"
		/>

		<!-- submit -->
		<Button id="modalbox-login-button" type="submit" class="w-full">Login!</Button>
	</form>
</div>
