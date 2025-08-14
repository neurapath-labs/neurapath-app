<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";

  let element: HTMLDivElement | null = null;
  
  type TurnstileProps = {
    sitekey: string;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact' | 'invisible';
    action?: string;
    cData?: string;
    callback?: (token: string) => void;
    'retry-interval'?: number;
    retry?: 'auto' | 'never';
  };

  const props: TurnstileProps = $props();
  let widgetId: any = null;

  function loadTurnstileScript(): Promise<void> {
    if (!browser) return Promise.resolve();
    const w = window as unknown as { turnstile?: any; __turnstileLoadingPromise?: Promise<void> };
    if (w.turnstile) return Promise.resolve();
    if (w.__turnstileLoadingPromise) return w.__turnstileLoadingPromise;
    w.__turnstileLoadingPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Turnstile'));
      document.head.appendChild(script);
    });
    return w.__turnstileLoadingPromise;
  }

  onMount(() => {
    loadTurnstileScript()
      .then(() => {
        const w = window as unknown as { turnstile?: any };
        if (!w.turnstile || !element) return;
        widgetId = w.turnstile.render(element, {
          sitekey: props.sitekey,
          theme: props.theme ?? 'auto',
          size: props.size ?? 'normal',
          action: props.action,
          cData: props.cData,
          callback: (token: string) => props.callback?.(token),
          'retry-interval': props['retry-interval'],
          retry: props.retry ?? 'auto'
        });
      })
      .catch(() => {
        // ignore load errors here
      });
  });

  onDestroy(() => {
    try {
      const w = window as unknown as { turnstile?: any };
      if (widgetId && w.turnstile && element) {
        w.turnstile.remove(element);
      }
    } catch {}
  });
</script>

<div bind:this={element}></div>