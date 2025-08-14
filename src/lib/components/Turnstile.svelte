<script lang="ts" module>
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  document.body.appendChild(script);

  await new Promise<unknown>((resolve, reject) => {
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
  });

  const turnstile = window.turnstile;
</script>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { RenderParameters } from "turnstile-types";

  let element: HTMLDivElement;

  const props: RenderParameters = $props();

  onMount(() => {
    turnstile.render(element, props);
  });

  onDestroy(() => {
    turnstile.remove(element);
  });
</script>

<div bind:this={element}></div>