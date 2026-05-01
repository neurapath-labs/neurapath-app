<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { getPayloadConfigFromPayload, useChart, type TooltipPayload } from "./chart-utils.js";
	import { Tooltip as TooltipPrimitive } from "layerchart";
	import type { Snippet } from "svelte";

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function defaultFormatter(value: any, _payload: TooltipPayload[]) {
		return `${value}`;
	}

	function normalizeTooltipPayload(data: unknown): TooltipPayload[] {
		if (Array.isArray(data)) {
			return data.map(normalizeTooltipItem);
		}

		return [normalizeTooltipItem(data)];
	}

	function normalizeTooltipItem(data: unknown): TooltipPayload {
		if (typeof data !== "object" || data === null) {
			return {
				key: "value",
				label: "value",
				name: "value",
				value: `${data}`,
			};
		}

		const payload = data as Record<string, unknown>;
		const key = getStringValue(payload.key) ?? getStringValue(payload.type) ?? getStringValue(payload.name) ?? getStringValue(payload.label) ?? "value";
		const label = getStringValue(payload.label) ?? getStringValue(payload.type) ?? getStringValue(payload.name) ?? key;
		const value =
			getDisplayValue(payload.value) ??
			getDisplayValue(payload.count) ??
			Object.values(payload).find((item): item is number => typeof item === "number");

		return {
			...payload,
			key,
			label,
			name: label,
			value,
			color: getStringValue(payload.color) ?? getStringValue(payload.c),
			payload,
		};
	}

	function getStringValue(value: unknown) {
		return typeof value === "string" ? value : undefined;
	}

	function getDisplayValue(value: unknown) {
		return typeof value === "number" || typeof value === "string" ? value : undefined;
	}

	let {
		ref = $bindable(null),
		class: className,
		hideLabel = false,
		indicator = "dot",
		hideIndicator = false,
		labelKey,
		label,
		labelFormatter = defaultFormatter,
		labelClassName,
		formatter,
		nameKey,
		color,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> & {
		hideLabel?: boolean;
		label?: string;
		indicator?: "line" | "dot" | "dashed";
		nameKey?: string;
		labelKey?: string;
		hideIndicator?: boolean;
		labelClassName?: string;
		labelFormatter?: // eslint-disable-next-line @typescript-eslint/no-explicit-any
		((value: any, payload: TooltipPayload[]) => string | number | Snippet) | null;
		formatter?: Snippet<
			[
				{
					value: unknown;
					name: string;
					item: TooltipPayload;
					index: number;
					payload: TooltipPayload[];
				},
			]
		>;
	} = $props();

	const chart = useChart();
</script>

{#snippet TooltipLabel(formattedLabel: string | number | Snippet | null)}
	{#if formattedLabel !== null}
		<div class={cn("font-medium", labelClassName)}>
			{#if typeof formattedLabel === "function"}
				{@render formattedLabel()}
			{:else}
				{formattedLabel}
			{/if}
		</div>
	{/if}
{/snippet}

<TooltipPrimitive.Root variant="none">
	{#snippet children({ data })}
		{@const payload = normalizeTooltipPayload(data)}
		{@const [firstItem] = payload}
		{@const labelConfigKey = labelKey ?? firstItem?.label ?? firstItem?.name ?? "value"}
		{@const labelConfig = firstItem ? getPayloadConfigFromPayload(chart.config, firstItem, labelConfigKey) : undefined}
		{@const labelValue =
			hideLabel || !firstItem
				? null
				: !labelKey && typeof label === "string"
					? (chart.config[label as keyof typeof chart.config]?.label ?? label)
					: (labelConfig?.label ?? firstItem.label ?? null)}
		{@const formattedLabel = labelValue !== null && labelFormatter ? labelFormatter(labelValue, payload) : labelValue}
		{@const nestLabel = payload.length === 1 && indicator !== "dot"}
		<div
			class={cn(
				"border-border/50 bg-background grid min-w-[9rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
				className
			)}
			{...restProps}
		>
			{#if !nestLabel}
				{@render TooltipLabel(formattedLabel)}
			{/if}
			<div class="grid gap-1.5">
				{#each payload as item, i (item.key + i)}
					{@const key = `${nameKey || item.key || item.name || "value"}`}
					{@const itemConfig = getPayloadConfigFromPayload(chart.config, item, key)}
					{@const indicatorColor = color || item.payload?.color || item.color}
					<div
						class={cn(
							"[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5",
							indicator === "dot" && "items-center"
						)}
					>
						{#if formatter && item.value !== undefined && item.name}
							{@render formatter({
								value: item.value,
								name: item.name,
								item,
								index: i,
								payload,
							})}
						{:else}
							{#if itemConfig?.icon}
								<itemConfig.icon />
							{:else if !hideIndicator}
								<div
									style="--color-bg: {indicatorColor}; --color-border: {indicatorColor};"
									class={cn(
										"border-(--color-border) bg-(--color-bg) shrink-0 rounded-[2px]",
										{
											"size-2.5": indicator === "dot",
											"h-full w-1": indicator === "line",
											"w-0 border-[1.5px] border-dashed bg-transparent":
												indicator === "dashed",
											"my-0.5": nestLabel && indicator === "dashed",
										}
									)}
								></div>
							{/if}
							<div
								class={cn(
									"flex flex-1 shrink-0 justify-between leading-none",
									nestLabel ? "items-end" : "items-center"
								)}
							>
								<div class="grid gap-1.5">
									{#if nestLabel}
										{@render TooltipLabel(formattedLabel)}
									{/if}
									<span class="text-muted-foreground">
										{itemConfig?.label || item.name}
									</span>
								</div>
								{#if item.value !== undefined}
									<span class="text-foreground font-mono font-medium tabular-nums">
										{item.value.toLocaleString()}
									</span>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/snippet}
</TooltipPrimitive.Root>
