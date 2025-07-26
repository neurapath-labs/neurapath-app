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

    if (!username || !password) {
      return fail(400, { error: 'Invalid input' });
    }

    try {
      // 1) Try to authenticate
      let user = await authenticateUser(username, password);

      // 2) If not found/invalid, auto-register and then proceed
      if (!user) {
        user = await createUser(username, password);
      }

      // 3) Issue JWT & set cookie
      const token = await generateToken(user);

      cookies.set('token', token, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'strict',
        maxAge: 60 * 60 * 2 // 2 hours
      });

      throw redirect(303, '/');
    } catch (error: any) {
      console.error(error);
      return fail(401, {
        error: error?.message ?? 'Invalid credentials'
      });
    }
  }
};
