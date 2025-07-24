import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { authenticateUser, generateToken } from '$lib/services/user.service';

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

    if (typeof username !== 'string' || typeof password !== 'string') {
      return {
        error: 'Invalid input'
      };
    }

    // Authenticate user
    const user = await authenticateUser(username, password);
    
    if (user) {
      // Generate JWT token
      const token = generateToken(user);
      
      // Set secure cookie
      cookies.set('token', token, {
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 60 * 60 // 1 hour
      });
      
      throw redirect(302, '/');
    }

    return {
      error: 'Invalid credentials',
    };
  },
};