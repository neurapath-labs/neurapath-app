import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/services/user.service';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('token');

  if (token) {
    // Verify the token
    const user = verifyToken(token);
    
    if (user) {
      event.locals.user = {
        name: user.username,
        role: 'user', // In a real app, this would come from the user object
      };
    } else {
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  return resolve(event);
};