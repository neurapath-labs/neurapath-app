import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/services/user.service';
import { env } from "$env/dynamic/private";

export const handle: Handle = async ({ event, resolve }) => {
  const simulateLoggedInUser = env.SIMULATE_LOGGED_IN_USER === 'true';
  if (simulateLoggedInUser) {
    // Simulate a logged-in user
    event.locals.user = {
      name: 'admin',
      role: 'user'
    };
  } else {
    // Normal authentication flow
    const token = event.cookies.get('token');

    if (token) {
      const user = await verifyToken(token);

      if (user) {
        event.locals.user = {
          name: user.username,
          role: 'user',
        };
        
        // Also set the password in locals if available
        const password = event.cookies.get('password');
        if (password) {
          event.locals.password = password;
        }
      } else {
        event.locals.user = null;
      }
    } else {
      event.locals.user = null;
    }
  }

  return resolve(event);
};
