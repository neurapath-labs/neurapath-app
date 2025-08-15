<script lang="ts">
	/* ────────── stores ────────── */
	import { auth } from "$lib/stores/auth.store";
	import { database } from "$lib/stores/database.store";
	import { learning } from "$lib/stores/learning.store";
	import { ui } from "$lib/stores/ui.store";
	import { modal } from "$lib/stores/modal.store";
	import { toggleMode } from "mode-watcher";
	import { contextmenu } from "$lib/stores/contextmenu.store";
	import { lastSaved } from "$lib/stores/lastSaved.store";
	import { Badge } from "$lib/components/ui/badge/index.js";

	import { onDestroy } from "svelte";
	import type { Record } from "$lib/models";

	/* ────────── components / ui ────────── */
	import { Button } from "$lib/components/ui/button";
	import TreeItem from "$lib/components/TreeItem.svelte";

	/* ────────── icons ────────── */
	import UserIcon from "@lucide/svelte/icons/user";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import SunIcon from "@lucide/svelte/icons/sun";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import SearchIcon from "@lucide/svelte/icons/search";
	import FlagIcon from "@lucide/svelte/icons/flag";
	import BarChartIcon from "@lucide/svelte/icons/bar-chart";
	import LogOutIcon from "@lucide/svelte/icons/log-out";

	/* ────────── local state (runes) ────────── */
	let learningMode = $state(false);
	let expandedFolders = $state<Set<string>>(new Set());
	let activeItemId = $state<string | null>(null);
	// theme toggling handled via mode-watcher

	/* ────────── store subscriptions ────────── */
	const unsubLearning = learning.subscribe(
		($l) => (learningMode = $l.isInLearningMode),
	);
	const unsubUI = ui.subscribe(($u) => {
		expandedFolders = $u.expandedFolders;
		activeItemId = $u.activeItemId;
	});
	// no custom theme subscription required
	let lastSavedTime = $state<string>("");
	const unsubLastSaved = lastSaved.subscribe(($ls) => {
		if ($ls.lastSaved) {
			const date = new Date($ls.lastSaved);
			lastSavedTime = date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		} else {
			lastSavedTime = "‑";
		}
	});

	onDestroy(() => {
		unsubLearning();
		unsubUI();
		// nothing to unsubscribe for theme
		unsubLastSaved();
	});

	/* ────────── derived values ────────── */
	let dueCount = $derived(
		() =>
			$database.items.filter(
				(i) =>
					["Cloze", "Extract", "Occlusion"].includes(i.contentType) &&
					i.dueDate &&
					new Date(i.dueDate) <= new Date(),
			).length,
	);

	/* ────────── helpers ────────── */
	interface TreeNode {
		[k: string]: TreeNode | Record | undefined;
		_item?: Record;
	}
	const renderFolders = (items: Record[]): TreeNode => {
		const tree: TreeNode = {};
		for (const item of items) {
			const parts = item.id.split("/");
			let cur: TreeNode = tree;
			parts.forEach((part, i) => {
				cur[part] ||= {};
				if (i === parts.length - 1)
					(cur[part] as TreeNode)._item = item;
				cur = cur[part] as TreeNode;
			});
		}
		return tree;
	};

	/* ────────── action handlers ────────── */
	const toggleLearningMode = () => learning.toggleLearningMode();
	const handleLogout = async () => {
		await auth.logout();
		window.location.href = "/login";
	};
	const renderExplorer = () => ui.openExplorer();
	const renderFlagged = () => ui.openFlagged();
	const renderStatistics = () => ui.openStatistics();
	const renderDatabases = () => ui.openDatabases();
	const renderImportExport = () => ui.openExportImport();
	// use mode-watcher's toggle
	const toggleTheme = () => toggleMode();

	function handleSidebarContextMenu(e: MouseEvent) {
		e.preventDefault();
		const el = (e.target as HTMLElement).closest("[data-fullpath]");
		const fullPath = el?.getAttribute("data-fullpath");
		contextmenu.showContextMenu(
			e.clientX,
			e.clientY,
			fullPath ?? null,
			fullPath ? "sidebar-item" : "sidebar-background",
		);
	}
	
	/* ────────── drag and drop handlers ────────── */
	async function handleSidebarDrop(e: DragEvent) {
		e.preventDefault();
		
		if (!e.dataTransfer) return;
		
		const itemId = e.dataTransfer.getData('text/plain');
		if (!itemId) return;
		
		// Move the item to the root level (empty parent path)
		await database.moveItem(itemId, "");
	}
	
	function handleSidebarDragOver(e: DragEvent) {
		// Allow dropping on the sidebar background to move items to root
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
	}
</script>

<aside
	class="grid-area[sidebar] flex h-screen w-[clamp(230px,26vw,280px)] min-w-[220px] flex-col gap-4 overflow-y-auto border-r border-black/5 bg-[rgb(var(--background-color_sidebar))] p-4 text-[rgb(var(--font-color))] select-none"
	oncontextmenu={handleSidebarContextMenu}
	ondrop={handleSidebarDrop}
	ondragover={handleSidebarDragOver}
>
	<!-- header -->
	<header class="flex gap-3">
		<img src="/img/logo/logo.svg" alt="Neurapath logo" class="h-12 w-12" />
		<div class="space-y-1">
			<h1 class="m-0 text-xl leading-tight">
				Neurapath
			</h1>
			<p class="text-xs">
				<span>Last saved:</span> <span id="sidebar-last-saved">{lastSavedTime}</span>
			</p>
			<!-- <p class="text-xs">
				<span>Due today:</span> <span id="sidebar-due-items">{dueCount}</span>
			</p> -->
		</div>
	</header>

	<!-- learning button -->
	<Button
		id="learning-button"
		variant="outline"
		class={`rounded-md px-4 py-2 font-medium transition-colors cursor-pointer ${
			learningMode
				? "bg-red-500/90 text-white hover:bg-red-600"
				: "bg-[rgb(var(--background-color_button))] text-[rgb(var(--font-color_button))] hover:bg-[rgb(var(--background-color_button-hover))] hover:text-[rgb(var(--font-color_button))] border-[rgb(var(--background-color_button))] dark:bg-[rgb(var(--background-color_button))] dark:text-[rgb(var(--font-color_button))] dark:hover:bg-[rgb(var(--background-color_button-hover))] dark:hover:text-[rgb(var(--font-color_button))] dark:border-[rgb(var(--background-color_button))]"
		}`}
		onclick={toggleLearningMode}
	>
		{learningMode ? "Stop learning!" : "Practice mode!"}
	</Button>

	<!-- quick actions -->
	<nav id="quick-actions" class="flex flex-col gap-1 text-sm">
		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-[rgba(var(--background-color),0.10)] hover:shadow-[inset_2px_0_0_0_rgb(var(--background-color_button))] active:bg-[rgba(var(--background-color),0.14)] cursor-pointer"
			onclick={() => modal.openSpotlightSearchModal()}
		>
			<SearchIcon class="h-4 w-4" /><span>Search</span>
			<Badge
				variant="outline"
				class="ml-auto text-xs border-[rgb(var(--background-color))] text-[rgb(var(--font-color))] bg-[rgba(var(--background-color),0.08)]"
			>
				Ctrl/Cmd + J
			</Badge>
		</button>
		
		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-[rgba(var(--background-color),0.10)] hover:shadow-[inset_2px_0_0_0_rgb(var(--background-color_button))] active:bg-[rgba(var(--background-color),0.14)] cursor-pointer"
			onclick={() => modal.openSettingsModal()}
		>
			<UserIcon class="h-4 w-4" /><span>Settings</span>
		</button>

		<button
			type="button"
			class="action relative flex items-center gap-2 rounded px-2 py-1 hover:bg-[rgba(var(--background-color),0.10)] hover:shadow-[inset_2px_0_0_0_rgb(var(--background-color_button))] active:bg-[rgba(var(--background-color),0.14)] cursor-pointer"
			onclick={toggleTheme}
		>
			<SunIcon
				class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
			/>
			<MoonIcon
				class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
			/>
			<span id="darkmode-text">Toggle theme</span>
		</button>

		<!-- <button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
			onclick={renderDatabases}
		>
			<DatabaseIcon class="h-4 w-4" /><span>Shared databases</span>
		</button> -->

		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-[rgba(var(--background-color),0.10)] hover:shadow-[inset_2px_0_0_0_rgb(var(--background-color_button))] active:bg-[rgba(var(--background-color),0.14)] cursor-pointer"
			onclick={renderImportExport}
		>
			<DatabaseIcon class="h-4 w-4" /><span>Import/export</span>
					  <!-- <button class="w-full mt-2" onclick={openExportImport} on:pointerdown={() => ('[DatabasesModal] Button pointerdown event')}>Export / Import Database</Button> -->
		</button> 


		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-[rgba(var(--background-color),0.10)] hover:shadow-[inset_2px_0_0_0_rgb(var(--background-color_button))] active:bg-[rgba(var(--background-color),0.14)] cursor-pointer"
			onclick={renderExplorer}
		>
			<SearchIcon class="h-4 w-4" /><span>Item explorer</span>
		</button>

		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-[rgba(var(--background-color),0.10)] hover:shadow-[inset_2px_0_0_0_rgb(var(--background-color_button))] active:bg-[rgba(var(--background-color),0.14)] cursor-pointer"
			onclick={renderFlagged}
		>
			<FlagIcon class="h-4 w-4" /><span>Flagged items</span>
		</button>

		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-[rgba(var(--background-color),0.10)] hover:shadow-[inset_2px_0_0_0_rgb(var(--background-color_button))] active:bg-[rgba(var(--background-color),0.14)] cursor-pointer"
			onclick={renderStatistics}
		>
			<BarChartIcon class="h-4 w-4" /><span>Statistics</span>
		</button>

		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-[rgba(var(--background-color),0.12)] hover:shadow-[inset_3px_0_0_0_rgb(var(--background-color_button))] active:bg-[rgba(var(--background-color),0.14)] cursor-pointer"
			onclick={handleLogout}
		>
			<LogOutIcon class="h-4 w-4" /><span>Logout</span>
		</button>
	</nav>

	<!-- tree -->
	<section id="content-structure" class="mt-2 pr-2">
		{#if $database.items.length}
			{#each Object.entries(renderFolders($database.items)) as [key, node]}
				<TreeItem
					node={node as TreeNode}
					path={[key]}
					{expandedFolders}
					{activeItemId}
				/>
			{/each}
		{:else}
			<p class="text-sm opacity-60">Quick start</p>
		{/if}
	</section>
</aside>
