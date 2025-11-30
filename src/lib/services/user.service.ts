/* src/lib/user.service.ts */
import jwt from '@tsndr/cloudflare-worker-jwt';
import {
  login as backendLogin,
  register as backendRegister
} from './database.service';

import type { User } from '$lib/models';
import { env } from '$env/dynamic/private';

const getJwtSecret = () => {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return env.JWT_SECRET;
};

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
  try {
    await backendLogin(username, password);
    return { id: username, username };
  } catch (error: any) {
    console.error('[UserService] Authentication error:', error.message);
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
  // Basic validation
  if (username.length < 3) throw new Error('Username must be at least 3 characters');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');

  // Backend will throw if the username already exists
  await backendRegister(username, password);

  return { id: username, username };
};

/* ------------------------------------------------------------------ */
/*  JWT helpers (client‑side session)                                 */
/* ------------------------------------------------------------------ */

export const generateToken = async (user: User): Promise<string> => {
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      // Expires in 2 hours
      exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60
    },
    getJwtSecret()
  );
  return token;
};

export const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const { payload } = (await jwt.verify(token, getJwtSecret())) as unknown as {
      payload: {
        userId: string;
        username: string;
      };
    };
    return { id: payload.userId, username: payload.username };
  } catch (error) {
    console.error('[UserService] Token verification failed:', error);
    return null;
  }
};
