<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { mode } from "mode-watcher";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
	import XCircleIcon from "@lucide/svelte/icons/x-circle";
	import InfoIcon from "@lucide/svelte/icons/info";

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	toastOptions={{
		classes: {
			error: "bg-red-500 text-white"
		}
	}}
	{...restProps}
>
	{#snippet successIcon()}
		<CheckCircleIcon />
	{/snippet}
	{#snippet errorIcon()}
		<XCircleIcon />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon />
	{/snippet}
</Sonner>
