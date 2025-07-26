import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Protect every page inside the “(authenticated)” group.
 * If no user is present in `locals`, redirect to /login.
 * We also expose that user to the client so child pages
 * can use `$page.data.user`.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    // remember where the visitor wanted to go
    const next = encodeURIComponent(url.pathname + url.search);
    throw redirect(303, `/login?next=${next}`);
  }

  return {
    user: locals.user // ↴ accessible in +page.svelte via `export let data`
  };
};
