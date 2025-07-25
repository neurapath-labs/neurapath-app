import { compare, hash } from 'bcrypt-ts';
import jwt from "@tsndr/cloudflare-worker-jwt";
import { getUserByUsername, createUser as createDatabaseUser } from './database.service';
import type { User } from '$lib/models';
import { JWT_SECRET } from '$env/static/private';

const SALT_ROUNDS = 10;

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // Find user by username from database
    const user = await getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    // Check if password matches
    const isPasswordValid = await compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // Return user without password hash
    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const createUser = async (username: string, password: string): Promise<User> => {
  // Check if user already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }
  
  // Validate username
  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  
  // Validate password
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  // Hash password
  const passwordHash = await hash(password, SALT_ROUNDS);
  
  // Create user in database
  const user = await createDatabaseUser({
    username,
    passwordHash
  });
  
  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const generateToken = async (user: User): Promise<string> => {
  return await jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + (2 * (60 * 60)) // Expires: Now + 2h
    }, JWT_SECRET);
};

export const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const decoded = await jwt.verify(token, JWT_SECRET) as unknown as { userId: string; username: string };
    return {
      id: decoded.userId,
      username: decoded.username
    };
  } catch (_error) {
    return null;
  }
};