<script lang="ts">
	/* UI primitives */
	import { Input }  from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	/* props (replace `export let`) */
	const { form } = $props<{ form?: { error?: string } }>();

	/* local state */
	let username = $state('');
	let password = $state('');
</script>

<!-- modal wrapper -->
<div
	class="fixed left-1/2 top-1/2 z-10 grid h-[600px] w-[400px] max-h-[600px] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded border bg-[rgb(var(--background-color_modalbox))] p-8 text-[rgb(var(--font-color))]"
>
	<form method="POST" action="?/login" class="contents">
		<!-- header -->
		<div class="mb-2 grid place-items-center text-center text-2xl">
			<img src="/img/logo/logo.svg" alt="Neuraa logo" class="w-[72px]" />
			<span class="whitespace-nowrap">Neuraa</span>
		</div>

		<!-- intro text -->
		<div class="mb-2 text-justify text-base">
			Welcome aboard! Neuraa is specifically tailored for effective studying.
			<u>New user:</u> enter a username and password then press login to create a new
			account. <u>Existing user:</u> enter your username and password below.
		</div>

		<!-- error -->
		{#if form?.error}
			<p role="alert" class="mb-2 text-sm text-red-500">{form.error}</p>
		{/if}

		<!-- username / password inputs -->
		<Input
			id="modalbox-login-username"
			name="username"
			placeholder="Username..."
			bind:value={username}
			required
			autocomplete="username"
		/>

		<Input
			id="modalbox-login-password"
			name="password"
			type="password"
			placeholder="Password..."
			bind:value={password}
			required
			autocomplete="current-password"
		/>

		<!-- submit -->
		<Button id="modalbox-login-button" type="submit" class="w-full">
			Login!
		</Button>
	</form>
</div>
