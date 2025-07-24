import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  // Remove the token cookie
  cookies.set('token', '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0 // Expire immediately
  });
  
  // Redirect to login page
  throw redirect(302, '/login');
};