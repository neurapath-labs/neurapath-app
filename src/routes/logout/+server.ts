import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

/**
 * Clears the JWT cookie and redirects the user to the login page.
 * We support both GET (link‑click) and POST (form‑submit / fetch) requests.
 */
const handler: RequestHandler = async ({ cookies }) => {
  // Remove the token cookie
  cookies.set('token', '', {
    path: '/',
    httpOnly: true,
    secure: !dev,      // secure in prod, loose in dev
    sameSite: 'strict',
    maxAge: 0          // Expire immediately
  });

  // Send the user back to the login screen
  throw redirect(303, '/login');
};

export const GET = handler;
export const POST = handler;
