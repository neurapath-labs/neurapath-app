<script lang="ts">
	/* ── UI primitives ───────────────────────────────── */
	import * as Card       from "$lib/components/ui/card/index.js";
	import { Button }     from "$lib/components/ui/button/index.js";
	import { Input }      from "$lib/components/ui/input/index.js";
	import { Label }      from "$lib/components/ui/label/index.js";

	/* ── props ───────────────────────────────────────── */
	const { form } = $props<{ form?: { error?: string } }>();
	/* The parent passes `id: () => string` so every control gets a
	   truly unique ID (SSR‑safe). */
	const id = $props.id();

	/* ── signals (reactive state) ───────────────────── */
	let username      = $state("");
	let password      = $state("");
	let isRegistering = $state(false);
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<form
		method="POST"
		action={isRegistering ? "/register" : "/login"}
		class="contents"
	>
		<!-- header --------------------------------------------------- -->
		<Card.Header class="flex items-center gap-3">
			<img alt="Neurapath logo" src={"img/logo/logo.svg"} />
			<div>
				<Card.Title class="text-2xl">
					{isRegistering ? "Register" : "Login"}
				</Card.Title>
				<Card.Description>
					{isRegistering
						? "Create a new account"
						: "Enter your username to log in"}
				</Card.Description>
			</div>
		</Card.Header>

		<!-- content -------------------------------------------------- -->
		<Card.Content>
			<div class="grid gap-4">
				{#if form?.error}
					<p role="alert" class="text-sm text-red-500">{form.error}</p>
				{/if}

				<!-- username -->
				<div class="grid gap-2">
					<Label for="username-{id}">Username</Label>
					<Input
						id="username-{id}"
						name="username"
						placeholder="jane_doe"
						bind:value={username}
						required
						autocomplete="username"
					/>
				</div>

				<!-- password -->
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password-{id}">Password</Label>
						<button
							type="button"
							class="ml-auto inline-block text-sm underline"
							onclick={() => /* trigger forgot‑password flow */ void 0}
						>
							Forgot your password?
						</button>
					</div>
					<Input
						id="password-{id}"
						name="password"
						type="password"
						bind:value={password}
						required
						autocomplete={isRegistering ? "new-password" : "current-password"}
					/>
				</div>

				<!-- submit -->
				<Button type="submit" class="w-full">
					{isRegistering ? "Register" : "Login"}
				</Button>
			</div>

			<!-- footer / toggle -------------------------------------- -->
			<div class="mt-4 text-center text-sm">
				{#if isRegistering}
					Already have an account?
					<button
						type="button"
						class="ml-1 underline"
						onclick={() => (isRegistering = false)}
					>
						Login
					</button>
				{:else}
					Don't have an account?
					<button
						type="button"
						class="ml-1 underline"
						onclick={() => (isRegistering = true)}
					>
						Register
					</button>
				{/if}
			</div>
		</Card.Content>
	</form>
</Card.Root>
