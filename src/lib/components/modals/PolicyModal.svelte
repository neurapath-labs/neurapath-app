<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import { ui } from '$lib/stores/ui.store';
  import ScaleIcon from '@lucide/svelte/icons/scale';
  import CheckIcon from '@lucide/svelte/icons/check';

  // Svelte 5 runes
  let isOpen: boolean = $state(false);
  let policyContent: string = $state('');
  let policyHtml: string = $state('');
  let loadedOnce: boolean = $state(false);

  // Subscribe to UI store for open state
  $effect(() => {
    const unsub = ui.subscribe(($ui) => {
      isOpen = $ui.isPolicyOpen;
    });
    return () => unsub();
  });

  // Load policy text once on client
  $effect(() => {
    if (!loadedOnce && typeof window !== 'undefined') {
      loadedOnce = true;
      loadPolicyContent();
    }
  });

  async function loadPolicyContent() {
    try {
        const response = await fetch('/text/privacy.md');
      policyContent = await response.text();
      policyHtml = renderMarkdown(policyContent);
    } catch (error) {
      console.error('Failed to load policy content:', error);
      policyContent = 'Failed to load policy content. Please try again later.';
      policyHtml = `<p>Failed to load policy content. Please try again later.</p>`;
    }
  }

  function closePolicy() {
    ui.closePolicy();
  }

  function handleAgree() {
    closePolicy();
  }

  function handleOpenChange(openState: boolean) {
    if (!openState) closePolicy();
  }

  // Very small markdown renderer for headings, emphasis, links and lists
  function renderMarkdown(src: string): string {
    const lines = src.replace(/\r\n?/g, '\n').split('\n');
    let html = '';
    let inList = false;

    const inline = (text: string) => {
      // escape HTML first
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      // links [text](url)
      let s = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      // bold **text**
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // italics _text_ or *text*
      s = s.replace(/(^|\W)_(.*?)_(?=\W|$)/g, '$1<em>$2</em>');
      s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return s;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*$/.test(line)) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      // headings
      const h3 = line.match(/^###\s+(.*)$/);
      if (h3) { if (inList) { html += '</ul>'; inList = false; } html += `<h3>${inline(h3[1])}</h3>`; continue; }
      const h2 = line.match(/^##\s+(.*)$/);
      if (h2) { if (inList) { html += '</ul>'; inList = false; } html += `<h2>${inline(h2[1])}</h2>`; continue; }
      const h1 = line.match(/^#\s+(.*)$/);
      if (h1) { if (inList) { html += '</ul>'; inList = false; } html += `<h1>${inline(h1[1])}</h1>`; continue; }

      // list item
      const li = line.match(/^\s*[-*]\s+(.*)$/);
      if (li) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${inline(li[1])}</li>`;
        continue;
      }

      // paragraph (merge consecutive non-empty non-list lines)
      let para = line;
      while (i + 1 < lines.length && !/^\s*$/.test(lines[i + 1]) && !/^\s*[-*]\s+/.test(lines[i + 1]) && !/^#{1,3}\s+/.test(lines[i + 1])) {
        para += ' ' + lines[++i];
      }
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${inline(para)}</p>`;
    }
    if (inList) html += '</ul>';
    return html;
  }
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-transparent z-50" />

    <Dialog.Content
      class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
             w-[90vw] max-w-[650px] max-h-[90vh]
             grid grid-rows-[auto_1fr_auto] overflow-hidden
             rounded-lg border border-[rgb(var(--background-color))]
             bg-[rgb(var(--background-color_modalbox))]
             text-[rgb(var(--font-color))] p-8 shadow-lg focus:outline-none z-50"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 mb-2">
        <ScaleIcon class="w-10 h-10" />
        <h1 class="text-2xl font-semibold">Terms of agreement</h1>
      </div>
      <p class="text-sm italic opacity-80 mb-4">Please read and accept the policy below.</p>

      <!-- Content -->
      <div class="overflow-y-auto pr-1 text-base leading-relaxed prose prose-sm dark:prose-invert max-w-none">
        {@html policyHtml}
      </div>

      <!-- Footer -->
      <div class="mt-6 flex justify-end gap-2">
        <Button type="button" onclick={handleAgree} class="cursor-pointer" variant="outline" size="sm">
          <CheckIcon class="mr-2 size-4" />
          I agree
        </Button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
