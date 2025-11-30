import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
    createUser,
    generateToken
} from '$lib/services/user.service';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) throw redirect(302, '/');
    return {};
};

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const username = (data.get('username') ?? '').toString().trim();
        const password = (data.get('password') ?? '').toString();

        if (!username || !password) {
            return fail(400, { error: 'Username and password are required' });
        }

        if (username.length < 3) {
            return fail(400, { error: 'Username must be at least 3 characters' });
        }

        if (password.length < 6) {
            return fail(400, { error: 'Password must be at least 6 characters' });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return fail(400, { error: 'Username can only contain letters, numbers, underscores, and hyphens' });
        }

        try {
            // Create user (will throw if username already exists)
            const user = await createUser(username, password);

            // Issue JWT
            const token = await generateToken(user);

            // Set cookies
            cookies.set('password', password, {
                path: '/',
                httpOnly: true,
                secure: !dev,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });
            cookies.set('token', token, {
                path: '/',
                httpOnly: true,
                secure: !dev,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });

            throw redirect(303, '/');
        } catch (error: any) {
            // Handle redirect
            if (error?.status === 303) throw error;

            // Handle registration errors
            const message = error?.message ?? 'Registration failed';
            if (message.includes('already')) {
                return fail(409, { error: 'Username already taken' });
            }
            return fail(400, { error: message });
        }
    }
};
