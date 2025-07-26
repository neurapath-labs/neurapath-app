<script lang="ts">
  import LoginModal from '$lib/components/modals/LoginModal.svelte';
  // SvelteKit injects `form` for us so we can show server-side errors
  export let form: import('./$types').ActionData | undefined;
</script>

<LoginModal {form} />