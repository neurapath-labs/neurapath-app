import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/services/user.service';
import { SIMULATE_LOGGED_IN_USER } from "$env/static/private";

export const handle: Handle = async ({ event, resolve }) => {

  console.log(SIMULATE_LOGGED_IN_USER)
  const simulateLoggedInUser = SIMULATE_LOGGED_IN_USER === 'true';
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
  }

  return resolve(event);
};
