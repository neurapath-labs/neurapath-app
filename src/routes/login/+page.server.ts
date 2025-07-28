import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { authenticateUser, generateToken } from '$lib/services/user.service';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ locals }) => {
  // Already signed‑in users go home
  if (locals.user) throw redirect(302, '/');
  return {};
};


export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = (data.get('username') ?? '').toString().trim();
    const password = (data.get('password') ?? '').toString();

    if (!username || !password) {
      return fail(400, { error: 'Invalid input' });
    }

    try {
      // 1 · authenticate
      const user = await authenticateUser(username, password);
      if (!user) throw new Error('Invalid credentials');

      // 2 · create JWT
      const token = await generateToken(user);

      // 3 · set cookies (password kept for DB encryption layer)
      cookies.set('password', password, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: 2147483647
      });
      cookies.set('token', token, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: 2147483647
      });

      // 4 · off you go
      throw redirect(303, '/');
    } catch (error: any) {
      console.error('[Login] ', error);
      return fail(401, { error: error?.message ?? 'Invalid credentials' });
    }
  }
};
