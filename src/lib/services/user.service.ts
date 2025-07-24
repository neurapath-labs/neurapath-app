import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByUsername, createUser as createDatabaseUser } from './database.service';
import type { User, UserWithPasswordHash } from '$lib/models';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'e0caabb2c0b63e401b4ecc29132d8e520e90733c0dcf62481deaf5eb412867ff6b5f98a7adead5782bb8ba1b71f978b8ee9b92a06ceb3b7b430d9288';

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // Find user by username from database
    const user = await getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
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
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Create user in database
  const user = await createDatabaseUser({
    username,
    passwordHash
  });
  
  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const generateToken = (user: User): string => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username 
    }, 
    JWT_SECRET, 
    { 
      expiresIn: '1h' 
    }
  );
};

export const verifyToken = (token: string): User | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    return {
      id: decoded.userId,
      username: decoded.username
    };
  } catch (error) {
    return null;
  }
};