import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/');
  }
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');

    // TODO: Implement actual authentication logic here.
    // For now, we'll just simulate a successful login.
    if (username && password) {
      cookies.set('token', 'fake-token', { path: '/' });
      throw redirect(302, '/');
    }

    return {
      error: 'Invalid credentials',
    };
  },
};