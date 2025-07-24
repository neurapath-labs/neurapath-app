import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createUser, authenticateUser, generateToken } from '$lib/services/user.service';

export const actions: Actions = {
  register: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');
    const confirmPassword = data.get('confirmPassword');

    // Validation
    if (typeof username !== 'string' || typeof password !== 'string' || typeof confirmPassword !== 'string') {
      return {
        error: 'Invalid input'
      };
    }

    if (username.length < 3) {
      return {
        error: 'Username must be at least 3 characters'
      };
    }

    if (password !== confirmPassword) {
      return {
        error: 'Passwords do not match'
      };
    }

    if (password.length < 6) {
      return {
        error: 'Password must be at least 6 characters'
      };
    }

    // Create user
    try {
      const user = await createUser(username, password);
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Set secure cookie
      cookies.set('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 // 1 hour
      });
      
      throw redirect(302, '/');
    } catch (error: any) {
      return {
        error: error.message || 'Registration failed'
      };
    }
  }
};