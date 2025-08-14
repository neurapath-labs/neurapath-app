import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
    createUser,
    authenticateUser,
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
            return fail(400, { error: 'Invalid input' });
        }

        // 1 · does the user already exist?
        if (await authenticateUser(username, password)) {
            return fail(409, { error: 'Username already taken' });
        }

        // 2 · create user
        const user = await createUser(username, password);

        // 3 · issue JWT
        const token = await generateToken(user);

        // 4 · cookies
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

        throw redirect(303, '/');
    }
};
