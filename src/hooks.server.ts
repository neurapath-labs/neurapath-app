import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/services/user.service';
import { SIMULATE_LOGGED_IN_USER } from "$env/static/private";

export const handle: Handle = async ({ event, resolve }) => {
  console.log('[Hooks] Handling request for URL:', event.url.pathname);
  console.log('[Hooks] Request method:', event.request.method);

  const simulateLoggedInUser = SIMULATE_LOGGED_IN_USER === 'true';
  if (simulateLoggedInUser) {
    console.log('[Hooks] Simulating logged-in user');
    // Simulate a logged-in user
    event.locals.user = {
      name: 'admin',
      role: 'user'
    };
  } else {
    console.log('[Hooks] Normal authentication flow');
    // Normal authentication flow
    const token = event.cookies.get('token');
    console.log('[Hooks] Token from cookies:', token);

    if (token) {
      console.log('[Hooks] Verifying token');
      // Verify the token
      const user = await verifyToken(token);
      console.log('[Hooks] Token verification result:', user);

      if (user) {
        console.log('[Hooks] Setting user in locals:', user.username);
        event.locals.user = {
          name: user.username,
          role: 'user', // In a real app, this would come from the user object
        };
        
        // Also set the password in locals if available
        const password = event.cookies.get('password');
        if (password) {
          event.locals.password = password;
        }
      } else {
        console.log('[Hooks] Token invalid, setting user to null');
        event.locals.user = null;
      }
    } else {
      console.log('[Hooks] No token found, setting user to null');
      event.locals.user = null;
    }
  }

  console.log('[Hooks] Final user state:', event.locals.user);
  return resolve(event);
};
