import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('token');

  if (token) {
    // TODO: Implement actual token verification logic here.
    // For now, we'll just simulate a valid token.
    event.locals.user = {
      name: 'Test User',
      role: 'admin',
    };
  } else {
    event.locals.user = null;
  }

  return resolve(event);
};