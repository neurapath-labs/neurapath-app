/* src/lib/user.service.ts */
import jwt from '@tsndr/cloudflare-worker-jwt';
import {
  login as backendLogin,
  register as backendRegister
} from './database.service';

import type { User } from '$lib/models';
import { JWT_SECRET } from '$env/static/private';

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Attempt a login against the Cloudflare‑Worker backend.
 * Returns a { id, username } object on success or `null` on failure.
 */
export const authenticateUser = async (
  username: string,
  password: string
): Promise<User | null> => {
  console.log('[UserService] Attempting to authenticate user:', username);
  try {
    // Will throw if credentials are wrong.
    console.log('[UserService] Calling backendLogin');
    await backendLogin(username, password);
    console.log('[UserService] Backend login successful');

    const user = { id: username, username };
    console.log('[UserService] Authentication successful for user:', username);
    return user;
  } catch (error) {
    console.error('[UserService] Authentication error:', error);
    return null;
  }
};

/**
 * Create a new user account via `/user/register` on the Worker.
 * Basic frontend validation is still done here; the Worker will run
 * its own checks too.
 */
export const createUser = async (
  username: string,
  password: string
): Promise<User> => {
  console.log('[UserService] Attempting to create user:', username);
  // Basic validation
  if (username.length < 3) throw new Error('Username must be at least 3 characters');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');

  console.log('[UserService] Calling backendRegister');
  // Backend will throw if the username already exists
  await backendRegister(username, password);
  console.log('[UserService] Backend registration successful');

  const user = { id: username, username };
  console.log('[UserService] User creation successful for user:', username);
  return user;
};

/* ------------------------------------------------------------------ */
/*  JWT helpers (client‑side session)                                 */
/* ------------------------------------------------------------------ */

export const generateToken = async (user: User): Promise<string> => {
  console.log('[UserService] Generating token for user:', user.username);
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      // Expires in 2 hours
      exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60
    },
    JWT_SECRET
  );
  console.log('[UserService] Token generated successfully for user:', user.username);
  return token;
};

export const verifyToken = async (token: string): Promise<User | null> => {
  console.log('[UserService] Verifying token');
  try {
    const { payload } = (await jwt.verify(token, JWT_SECRET)) as unknown as {
      payload: {
        userId: string;
        username: string;
      };
    };
    console.log('[UserService] Token verified successfully for user:', payload.username);
    return { id: payload.userId, username: payload.username };
  } catch (error) {
    console.error('[UserService] Token verification failed:', error);
    return null;
  }
};
