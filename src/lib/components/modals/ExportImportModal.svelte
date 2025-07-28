<script lang="ts">
	/* ---------- ui primitives ---------- */
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button }  from '$lib/components/ui/button';

	/* ---------- stores ---------- */
	import { ui }       from '$lib/stores/ui.store';
	import { database } from '$lib/stores/database.store';

	/* ---------- helpers / services ---------- */
	import {
		exportDatabaseToJSON,
		exportDatabaseToCSV,
		importDatabaseFromJSON,
		importDatabaseFromCSV
	} from '$lib/services/export.service';

	import { onMount, onDestroy } from 'svelte';
	import type { Record } from '$lib/models';

	/* ---------- icons ---------- */
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import UploadIcon from '@lucide/svelte/icons/upload';

	/* ---------- Svelte 5 runes ---------- */
	let isOpen: boolean       = $state(false);
	let isExporting: boolean  = $state(false);
	let isImporting: boolean  = $state(false);
	let selectedFile: File | null = $state(null);
	let importFormat: string  = $state('json');
	let databaseItems: Record[] = $state([]);

	/* ---------- reactive counts ---------- */
	let counts = $derived({
		folders:    databaseItems.filter(i => i.contentType === 'Folder').length,
		extracts:   databaseItems.filter(i => i.contentType === 'Extract').length,
		clozes:     databaseItems.filter(i => i.contentType === 'Cloze').length,
		images:     databaseItems.filter(i => i.contentType === 'Image').length,
		occlusions: databaseItems.filter(i => i.contentType === 'Occlusion').length
	});

	let unsubDB: () => void;
	let unsubUI: () => void;

	onMount(() => {
		unsubDB = database.subscribe($db => (databaseItems = $db.items));
		unsubUI = ui.subscribe($ui => (isOpen = $ui.isExportImportOpen));
	});

	onDestroy(() => {
		unsubDB?.();
		unsubUI?.();
	});

	/* ---------- helpers ---------- */
	function closeExportImport() {
		ui.closeExportImport();
		selectedFile = null;
	}

	/* keep store & dialog in sync */
	$effect(() => {
		if (!isOpen) closeExportImport();
	});

	function handleFileSelect(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const ext = file.name.split('.').pop()?.toLowerCase();
		if (ext === importFormat) selectedFile = file;
		else {
			alert(`Please select a ${importFormat.toUpperCase()} file.`);
			(e.target as HTMLInputElement).value = '';
		}
	}

	const handleDragOver = (e: DragEvent) => e.preventDefault();

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files?.[0];
		if (!file) return;
		const ext = file.name.split('.').pop()?.toLowerCase();
		if (ext === importFormat) selectedFile = file;
		else alert(`Please drop a ${importFormat.toUpperCase()} file.`);
	}

	const exportToJson = async () => {
		try { isExporting = true; await exportDatabaseToJSON(); }
		catch { alert('Error exporting database to JSON.'); }
		finally { isExporting = false; }
	};

	const exportToCsv = async () => {
		try { isExporting = true; await exportDatabaseToCSV(); }
		catch { alert('Error exporting database to CSV.'); }
		finally { isExporting = false; }
	};

	const importDatabase = async () => {
		if (!selectedFile) return alert('Please select a file first.');
		try {
			isImporting = true;
			const ok = importFormat === 'json'
				? await importDatabaseFromJSON(selectedFile)
				: await importDatabaseFromCSV(selectedFile);
			if (ok) closeExportImport();
		} catch {
			alert('Error importing database.');
		} finally {
			isImporting = false;
		}
	};
</script>

<!-- ─────────────────────────── Dialog ─────────────────────────── -->
<Dialog.Root bind:open={isOpen}>
	<Dialog.Content
		class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
		       rounded border border-[rgb(var(--background-color))]
		       bg-[rgb(var(--background-color_modalbox))] p-8
		       text-[rgb(var(--font-color))] shadow-lg
		       w-[min(100vw,560px)] max-h-[90vh] overflow-y-auto"
	>
		<!-- Header -->
		<Dialog.Header class="mb-6 flex flex-col items-center gap-2">
			<DatabaseIcon class="h-[72px] w-[72px]" />
			<Dialog.Title class="whitespace-nowrap text-2xl font-semibold">
				Export / Import Database
			</Dialog.Title>
		</Dialog.Header>

		<!-- Content -->
		<section class="space-y-10">
			<!-- Export -->
			<div>
				<h3 class="mb-1 text-lg font-semibold">Export Database</h3>
				<p class="mb-4 text-sm">
					Export your entire database to a file for backup or transfer.
				</p>

				{#if databaseItems.length}
					<div class="mb-4 rounded bg-[rgba(var(--background-color),0.5)] p-4 text-sm">
						<p class="m-0 mb-2">Current database contains:</p>
						<ul class="list-inside list-disc space-y-1">
							<li>Folders: {counts.folders}</li>
							<li>Extracts: {counts.extracts}</li>
							<li>Clozes: {counts.clozes}</li>
							<li>Images: {counts.images}</li>
							<li>Occlusions: {counts.occlusions}</li>
						</ul>
					</div>
				{:else}
					<p class="mb-4 text-sm italic">Your database is currently empty.</p>
				{/if}

				<div class="flex gap-3">
					<Button
						onclick={exportToJson}
						disabled={isExporting || !databaseItems.length}
						variant="outline"
						size="sm"
						class="flex-1"
					>
						{#if !isExporting}<DownloadIcon class="mr-2 h-4 w-4" />{/if}
						{isExporting ? 'Exporting…' : 'Export to JSON'}
					</Button>
					<Button
						onclick={exportToCsv}
						disabled={isExporting || !databaseItems.length}
						variant="outline"
						size="sm"
						class="flex-1"
					>
						{#if !isExporting}<DownloadIcon class="mr-2 h-4 w-4" />{/if}
						{isExporting ? 'Exporting…' : 'Export to CSV'}
					</Button>
				</div>
			</div>

			<!-- Import -->
			<div>
				<h3 class="mb-1 text-lg font-semibold">Import Database</h3>
				<p class="mb-4 text-sm">
					Import data from a previously exported file.
				</p>

				<!-- Format toggle -->
				<div class="mb-4 text-sm">
					<label class="mb-1 block font-medium" for="import-format">Import format:</label>
					<div id="import-format" class="flex items-center gap-4">
						<label>
							<input
								type="radio"
								name="import-format"
								value="json"
								checked={importFormat === 'json'}
								onchange={() => (importFormat = 'json')}
								class="mr-1"
							/> JSON
						</label>
						<label>
							<input
								type="radio"
								name="import-format"
								value="csv"
								checked={importFormat === 'csv'}
								onchange={() => (importFormat = 'csv')}
								class="mr-1"
							/> CSV
						</label>
					</div>
				</div>

				<!-- File picker / drop zone -->
				<div
					ondragover={handleDragOver}
					ondrop={handleDrop}
					role="region"
					aria-label="File drop zone"
					class="relative mb-4 rounded border-2 border-dashed p-5 text-center transition-colors duration-200"
					class:border-[rgb(var(--background-color_button))]={selectedFile}
					style="border-color: rgb(var(--background-color));"
				>
					{#if selectedFile}
						<p class="text-sm">Selected file: {selectedFile.name}</p>
						<Button
							size="sm"
							onclick={() => (selectedFile = null)}
							class="mt-2 rounded bg-[rgb(var(--background-color_button))] px-3 py-1 text-xs text-[rgb(var(--font-color_button))] hover:bg-[rgba(var(--background-color_button-hover))]"
						>
							Remove
						</Button>
					{:else}
						<p class="text-sm">
							Drag and drop a {importFormat.toUpperCase()} file here or click to select
						</p>
						<input
							type="file"
							accept={importFormat === 'json' ? '.json' : '.csv'}
							onchange={handleFileSelect}
							class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
						/>
					{/if}
				</div>

				<Button
					onclick={importDatabase}
					disabled={isImporting || !selectedFile}
					variant="outline"
					class="w-full"
				>
					{#if !isImporting}<UploadIcon class="mr-2 h-4 w-4" />{/if}
					{isImporting ? 'Importing…' : 'Import Database'}
				</Button>
			</div>
		</section>

	</Dialog.Content>
</Dialog.Root>
