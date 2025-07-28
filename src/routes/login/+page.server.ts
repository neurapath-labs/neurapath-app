import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { authenticateUser, createUser, generateToken } from '$lib/services/user.service';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(302, '/');
  return {};
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = (data.get('username') ?? '').toString().trim();
    const password = (data.get('password') ?? '').toString();

    ('[Login] Attempting login for user:', username);

    if (!username || !password) {
      ('[Login] Invalid input - missing username or password');
      return fail(400, { error: 'Invalid input' });
    }

    try {
      // 1) Try to authenticate
      ('[Login] Attempting to authenticate user');
      let user = await authenticateUser(username, password);
      ('[Login] Authentication result:', user);

      // 2) If not found/invalid, auto-register and then proceed
      if (!user) {
        ('[Login] User not found, attempting to create user');
        user = await createUser(username, password);
        ('[Login] User creation result:', user);
      }

      // 3) Issue JWT & set cookie
      ('[Login] Generating token for user:', user.username);
      const token = await generateToken(user);
      ('[Login] Token generated successfully');

      // Store password in session for database operations
      cookies.set('password', password, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: 2147483647 // Max value possible
      });
      ('[Login] Password cookie set successfully');

      ('[Login] Setting token cookie');
      cookies.set('token', token, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax', // Changed from 'strict' to 'lax'
        maxAge: 2147483647
      });
      ('[Login] Token cookie set successfully');

      ('[Login] Redirecting to home page');
      throw redirect(303, '/');
    } catch (error: any) {
      console.error('[Login] Error during login process:', error);
      console.error('[Login] Error type:', typeof error);
      console.error('[Login] Error constructor:', error.constructor.name);
      console.error('[Login] Error message:', error.message);
      console.error('[Login] Error stack:', error.stack);
      return fail(401, {
        error: error?.message ?? 'Invalid credentials'
      });
    }
  }
};
