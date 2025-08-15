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
	style="
		--normal-bg: rgb(var(--background-color_modalbox));
		--normal-text: rgb(var(--font-color));
		--normal-border: var(--color-border);
	"
	toastOptions={{
		class: "border bg-[rgb(var(--background-color_modalbox))] text-[rgb(var(--font-color))]",
		classes: {
			success: "bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] border-[rgb(var(--background-color))]",
			info: "bg-[rgba(var(--background-color),0.2)] text-[rgb(var(--font-color))] border-[rgb(var(--background-color))]",
			warning: "bg-yellow-500 text-black",
			error: "bg-red-600 text-white"
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
