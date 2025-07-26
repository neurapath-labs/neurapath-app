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
  try {
    // Will throw if credentials are wrong.
    await backendLogin(username, password);

    return { id: username, username };
  } catch (error) {
    console.error('Authentication error:', error);
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
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      // Expires in 2 hours
      exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60
    },
    JWT_SECRET
  );
};

export const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const decoded = (await jwt.verify(token, JWT_SECRET)) as unknown as {
      userId: string;
      username: string;
    };
    return { id: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
};
