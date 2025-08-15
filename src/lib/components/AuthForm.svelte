<script lang="ts">
	/* ── UI primitives ─────────────────────────────── */
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Loader2 } from "@lucide/svelte";
	import LogInIcon from "@lucide/svelte/icons/log-in";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import { turnstile } from "@svelte-put/cloudflare-turnstile";

	import { PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY } from "$env/static/public";

	let token = $state("");
	$inspect(token);

	/* ── props ─────────────────────────────────────── */
	const {
		form,
		id, // () => string  (SSR‑safe uid)
		mode = "login", // 'login' | 'register'
	} = $props<{
		form?: { error?: string };
		id: () => string;
		mode?: "login" | "register";
	}>();

	/* ── reactive state ───────────────────────────── */
	let username = $state("");
	let password = $state("");
	let isRegistering = $state(mode === "register");
	let isLoading = $state(false);
</script>

<Card.Root class="mx-auto w-full max-w-sm bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))] border border-[rgb(var(--background-color))]">
	<form
		method="POST"
		action={isRegistering ? "/register" : "/login"}
		class="contents"
		onsubmit={() => (isLoading = true)}
	>
		<!-- header ------------------------------------ -->
		<Card.Header class="flex flex-col items-center gap-4 text-center">
			<img
				src="/img/logo/logo.svg"
				alt="Neurapath logo"
				class="h-12 w-auto"
			/>

			<Card.Title class="text-2xl text-[rgb(var(--font-color))]">
				{isRegistering ? "Register" : "Login"}
			</Card.Title>

			<Card.Description class="text-[rgb(var(--font-color))] opacity-80">
				{isRegistering
					? "Create a new account"
					: "Enter your username to log in"}
			</Card.Description>
		</Card.Header>

		<!-- content ----------------------------------- -->
		<Card.Content>
			<div class="grid gap-4">
				{#if form?.error}
					<p role="alert" class="text-sm text-red-500">
						{form.error}
					</p>
				{/if}

				<!-- username -->
				<div class="grid gap-2">
					<Label for="username-{id()}">Username</Label>
					<Input
						id="username-{id()}"
						name="username"
						placeholder="jane_doe"
						bind:value={username}
						required
						autocomplete="username"
						class="text-[rgb(var(--font-color))] placeholder:!text-[rgba(var(--font-color),0.6)]"
					/>
				</div>

				<!-- password -->
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password-{id()}">Password</Label>
						<!-- <button
							type="button"
							class="ml-auto inline-block text-sm underline"
							onclick={() => /* forgot‑password flow */ void 0}
						>
							Forgot your password?
						</button> -->
					</div>
					<Input
						id="password-{id()}"
						name="password"
						type="password"
						bind:value={password}
						required
						autocomplete={isRegistering
							? "new-password"
							: "current-password"}
						class="text-[rgb(var(--font-color))] placeholder:!text-[rgba(var(--font-color),0.6)]"
					/>
				</div>

				<!-- Cloudflare Turnstile (above submit) -->
				<div class="mb-3 flex justify-center w-full max-w-sm mx-auto">
					<div
						use:turnstile
						turnstile-sitekey={PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
						turnstile-theme="auto"
						turnstile-size="normal"
						turnstile-language="en"
						turnstile-response-field-name="turnstile"
						turnstile-response-field
						onturnstile={(e) => (token = e.detail.token)}
					></div>
				</div>

				<!-- submit -->
				<Button
					type="submit"
					class="w-full bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgb(var(--background-color_button-hover))] flex items-center justify-center gap-2"
					disabled={isLoading}
					aria-busy={isLoading}
				>
					{#if isLoading}
						<Loader2 class="animate-spin" aria-hidden="true" />
					{:else}
						{#if isRegistering}
							<UserPlusIcon class="size-4" aria-hidden="true" />
						{:else}
							<LogInIcon class="size-4" aria-hidden="true" />
						{/if}
					{/if}
					<span>{isRegistering ? "Register" : "Login"}</span>
				</Button>
			</div>

			<!-- footer / toggle ------------------------- -->
			<div class="mt-4 text-center text-sm">
				{#if isRegistering}
					Already have an account?
					<button
						type="button"
						class="ml-1 underline"
						onclick={() => {
							isRegistering = false;
						}}
					>
						Login
					</button>
				{:else}
					Don't have an account?
					<button
						type="button"
						class="ml-1 underline"
						onclick={() => {
							isRegistering = true;
						}}
					>
						Register
					</button>
				{/if}
			</div>
		</Card.Content>
	</form>
</Card.Root>
