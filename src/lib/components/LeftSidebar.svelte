<script lang="ts">
  /* --------------  your original logic (unchanged) -------------- */
  import { auth } from '$lib/stores/auth.store';
  import { database } from '$lib/stores/database.store';
  import { learning } from '$lib/stores/learning.store';
  import { profile } from '$lib/stores/profile.store';
  import { contextmenu } from '$lib/stores/contextmenu.store';
  import { ui } from '$lib/stores/ui.store';
  import { modal } from '$lib/stores/modal.store';
  import type { Record } from '$lib/models';
  import { onMount, onDestroy } from 'svelte';
  import { createID } from '$lib/utils/helpers';

  let learningMode = false;
  let databaseItems: Record[] = [];
  let profileData: any = {};
  let lastRightClickedItemID: string | null = null;
  let expandedFolders: Set<string> = new Set();
  let activeItemId: string | null = null;
  let dueCount = 0;

  /* --- all your subscriptions / helpers exactly as supplied --- */
  const unsubDB = database.subscribe(($db) => {
    databaseItems = $db.items;
    dueCount = $db.items.filter(
      (i) =>
        ['Cloze', 'Extract', 'Occlusion'].includes(i.contentType) &&
        i.dueDate &&
        new Date(i.dueDate) <= new Date()
    ).length;
  });
  const unsubProfile  = profile.subscribe(($p) => (profileData = $p));
  const unsubLearning = learning.subscribe(($l) => (learningMode = $l.isInLearningMode));
  const unsubUI       = ui.subscribe(($u) => {
    expandedFolders = $u.expandedFolders;
    activeItemId    = $u.activeItemId;
  });

  onDestroy(() => {
    unsubDB(); unsubProfile(); unsubLearning(); unsubUI();
  });

  interface TreeNode { [k: string]: TreeNode | Record | undefined; _item?: Record }
  const renderFolders = (items: Record[]): TreeNode => {
    const tree: TreeNode = {};
    items.forEach((item) => {
      const parts = item.id.split('/');
      let cursor: TreeNode = tree;
      parts.forEach((part, idx) => {
        cursor[part] ||= {};
        if (idx === parts.length - 1) (cursor[part] as TreeNode)._item = item;
        cursor = cursor[part] as TreeNode;
      });
    });
    return tree;
  };

  const renderTree = (tree: TreeNode, path: string[] = []): string =>
    Object.keys(tree)
      .filter((k) => k !== '_item')
      .map((k) => {
        const nowPath   = [...path, k];
        const fullPath  = nowPath.join('/');
        const node      = tree[k] as TreeNode;
        const item      = node._item;
        const expanded  = expandedFolders.has(fullPath);

        return `
          <div class="menuSubItem">
            <p data-id="${fullPath}"
               data-fullpath="${fullPath}"
               class="${item ? item.contentType.toLowerCase() : 'folder'} ${
          activeItemId === fullPath ? 'active' : ''
        }">
              ${
                item && item.contentType === 'Folder'
                  ? `<img class="threeIcon" src="/img/${expanded ? 'folderopen' : 'folderclose'}.svg">`
                  : item && item.contentType === 'Cloze'
                  ? '<img class="threeIcon" src="/img/cloze.svg">'
                  : item && item.contentType === 'Extract'
                  ? '<img class="threeIcon" src="/img/extract.svg">'
                  : item && item.contentType === 'Occlusion'
                  ? '<img class="threeIcon" src="/img/occlusion2.svg">'
                  : '<img class="threeIcon" src="/img/folderclose.svg">'
              }
              ${k} ${item && item.isFlagged ? '🚩' : ''}
            </p>
            ${
              Object.keys(node).filter((c) => c !== '_item').length && expanded
                ? `<div class="menuSubItemChildren">${renderTree(node, nowPath)}</div>`
                : ''
            }
          </div>`;
      })
      .join('');

  /* ------------ handlers (cut down to essentials) ------------- */
  const toggleLearningMode = () => learning.toggleLearningMode();
  const handleLogout       = async () => { await auth.logout(); window.location.href = '/login'; };
  const openPdfImport      = () => ui.openPdfImport();
  const renderExplorer     = () => ui.openExplorer();
  const renderFlagged      = () => ui.openFlagged();
  const renderStatistics   = () => ui.openStatistics();
  const renderDatabases    = () => ui.openDatabases();
</script>

<!-- --------------  MARK‑UP -------------- -->
<aside id="sidebar-left">
  <header id="logo-area">
    <img src="/img/logo.svg" alt="neurapath logo" />
    <div>
      <h1>Neuraa</h1>
      <p class="tagline">Made in Sweden.</p>
      <p class="meta"><span>Last saved:</span><span id="sidebar-last-saved">‑</span></p>
      <p class="meta"><span>Due today:</span><span id="sidebar-due-items">{dueCount}</span></p>
    </div>
  </header>

  <button
    id="learning-button"
    class={learningMode ? 'stop' : 'start'}
    on:click={toggleLearningMode}>
    {learningMode ? 'Stop learning!' : 'Engage!'}
  </button>

  <nav id="quick-actions">
    <div class="action" on:click={() => modal.openSettingsModal()}>
      <img src="/img/user.svg" alt="" /><span>Settings</span>
    </div>
    <div class="action" id="header-darkmode-button">
      <img src="/img/night-mode.svg" alt="" /><span id="darkmode-text">Dark mode</span>
    </div>
    <div class="action" on:click={renderDatabases}>
      <img src="/img/database.svg" alt="" /><span>Shared databases</span>
    </div>
    <div class="action" on:click={openPdfImport}>
      <img src="/img/extract.svg" alt="" /><span>Import PDF</span>
    </div>
    <div class="action" on:click={renderExplorer}>
      <img src="/img/find.svg" alt="" /><span>Item explorer</span>
    </div>
    <div class="action" on:click={renderFlagged}>
      <img src="/img/unflag.svg" alt="" /><span>Flagged items</span>
    </div>
    <div class="action" on:click={renderStatistics}>
      <img src="/img/statistics.svg" alt="" /><span>Statistics</span>
    </div>
    <div class="action" on:click={handleLogout}>
      <img src="/img/lock.svg" alt="" /><span>Logout</span>
    </div>
  </nav>

  <section id="content-structure">
    {#if $database.items.length}
      {@html renderTree(renderFolders($database.items))}
    {:else}
      <p class="empty">Quick start</p>
    {/if}
  </section>
</aside>

<!-- --------------  STYLES -------------- -->
<style>
  /* ---------- theme knobs ---------- */
  :root {
    --sb-w: clamp(230px, 26vw, 280px);
    --sb-bg: rgb(var(--background-color_sidebar));
    --sb-fg: rgb(var(--font-color));
    --sb-accent: rgb(var(--background-color_button));
    --sb-accent-hover: rgb(var(--background-color_button-hover));
  }

  /* ---------- wrapper ---------- */
  #sidebar-left {
    grid-area: sidebar;
    width: var(--sb-w);
    min-width: 220px;
    height: 100vh;
    background: var(--sb-bg);
    color: var(--sb-fg);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    overflow-y: auto;
    border-right: 1px solid rgba(0, 0, 0, 0.06);
    -webkit-user-select: none; user-select: none;
  }

  /* ---------- header ---------- */
  #logo-area { display: flex; gap: 0.75rem; align-items: flex-start; }
  #logo-area img { width: 48px; height: 48px; }
  #logo-area h1 { margin: 0; font-size: 1.4rem; line-height: 1.1; }
  .tagline { font-style: italic; font-size: 0.75rem; margin: 0; }
  .meta { font-size: 0.75rem; margin: 0.15rem 0; display: flex; gap: 0.25rem; }

  /* ---------- learning button ---------- */
  #learning-button {
    border: 0;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  #learning-button.start { background: var(--sb-accent); color: var(--sb-fg); }
  #learning-button.stop  { background: rgba(255, 101, 101, 0.9); color: #fff; }
  #learning-button:hover { background: var(--sb-accent-hover); }

  /* ---------- quick actions ---------- */
  #quick-actions { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; }
  .action {
    display: flex; align-items: center; gap: 0.65rem;
    padding: 0.45rem 0.6rem;
    border-radius: 0.4rem;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .action img { width: 18px; height: 18px; flex-shrink: 0; }
  .action:hover  { background: rgba(0, 0, 0, 0.06); }
  .action:active { background: rgba(0, 0, 0, 0.12); }

  /* ---------- folder tree ---------- */
  #content-structure { margin-top: 0.5rem; padding-right: 0.5rem; }
  .menuSubItem > p {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.35rem 0.4rem;
    border-radius: 0.35rem;
    cursor: pointer;
    font-size: 0.85rem;
    max-width: 100%;
    overflow: hidden; text-overflow: ellipsis;
  }
  .menuSubItem > p:hover   { background: rgba(0, 0, 0, 0.06); }
  .menuSubItem > p.active  { background: rgba(var(--background-color_button), 0.45); }
  .threeIcon { width: 16px; height: 16px; flex-shrink: 0; }
  .empty { opacity: 0.6; font-size: 0.85rem; }

  /* ---------- scrollbar polish ---------- */
  #sidebar-left::-webkit-scrollbar { width: 6px; }
  #sidebar-left::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 3px; }
</style>
