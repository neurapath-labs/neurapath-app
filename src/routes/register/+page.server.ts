// register/+page.server.ts
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
    default: async ({ request, cookies, platform }) => {
        const data = await request.formData();
        const username = (data.get('username') ?? '').toString().trim();
        const password = (data.get('password') ?? '').toString();
        const cfToken = (data.get('cf-turnstile-response') ?? '').toString();

        if (!username || !password) {
            return fail(400, { error: 'Invalid input' });
        }
        
        // 0 · verify Turnstile
        if (!cfToken) return fail(400, { error: 'Verification failed' });
        const secret = ((platform as any)?.env?.TURNSTILE_SECRET_KEY ?? '') as string;
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret,
                response: cfToken
            })
        });
        const verification = (await res.json()) as { success?: boolean };
        if (!verification?.success) return fail(400, { error: 'Verification failed' });

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
