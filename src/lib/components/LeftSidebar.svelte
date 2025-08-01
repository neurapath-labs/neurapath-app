<script lang="ts">
	/* ────────── stores ────────── */
	import { auth } from "$lib/stores/auth.store";
	import { database } from "$lib/stores/database.store";
	import { learning } from "$lib/stores/learning.store";
	import { ui } from "$lib/stores/ui.store";
	import { modal } from "$lib/stores/modal.store";
	import { theme } from "$lib/stores/theme.store";
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
	let currentTheme = $state("day");

	/* ────────── store subscriptions ────────── */
	const unsubLearning = learning.subscribe(
		($l) => (learningMode = $l.isInLearningMode),
	);
	const unsubUI = ui.subscribe(($u) => {
		expandedFolders = $u.expandedFolders;
		activeItemId = $u.activeItemId;
	});
	const unsubTheme = theme.subscribe(
		($t) => (currentTheme = $t.currentTheme),
	);
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
		unsubTheme();
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
	const toggleTheme = () =>
		theme.setTheme(currentTheme === "day" ? "homebrew" : "day");

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
		class={`rounded-md px-4 py-2 font-medium transition-colors ${
			learningMode ? "bg-red-500/90 text-white hover:bg-red-600" : ""
		}`}
		onclick={toggleLearningMode}
	>
		{learningMode ? "Stop learning!" : "Practice mode!"}
	</Button>

	<!-- quick actions -->
	<nav id="quick-actions" class="flex flex-col gap-1 text-sm">
		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
			onclick={() => modal.openSpotlightSearchModal()}
		>
			<SearchIcon class="h-4 w-4" /><span>Search</span>
			<Badge variant="outline" class="ml-auto text-xs">Ctrl/Cmd + J</Badge>
		</button>
		
		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
			onclick={() => modal.openSettingsModal()}
		>
			<UserIcon class="h-4 w-4" /><span>Settings</span>
		</button>

		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
			onclick={toggleTheme}
		>
			{#if currentTheme === "day"}
				<MoonIcon class="h-4 w-4" />
			{:else}
				<SunIcon class="h-4 w-4" />
			{/if}
			<span id="darkmode-text">
				{currentTheme === "day" ? "Dark mode" : "Light mode"}
			</span>
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
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
			onclick={renderImportExport}
		>
			<DatabaseIcon class="h-4 w-4" /><span>Import/export</span>
					  <!-- <button class="w-full mt-2" onclick={openExportImport} on:pointerdown={() => ('[DatabasesModal] Button pointerdown event')}>Export / Import Database</Button> -->
		</button> 


		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
			onclick={renderExplorer}
		>
			<SearchIcon class="h-4 w-4" /><span>Item explorer</span>
		</button>

		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
			onclick={renderFlagged}
		>
			<FlagIcon class="h-4 w-4" /><span>Flagged items</span>
		</button>

		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
			onclick={renderStatistics}
		>
			<BarChartIcon class="h-4 w-4" /><span>Statistics</span>
		</button>

		<button
			type="button"
			class="action flex items-center gap-2 rounded px-2 py-1 hover:bg-black/5 active:bg-black/10"
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
					{node}
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
