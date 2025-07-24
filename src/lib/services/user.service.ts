import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// For now, we'll use a hardcoded user for demonstration
// In a real application, this would come from a database
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'e0caabb2c0b63e401b4ecc29132d8e520e90733c0dcf62481deaf5eb412867ff6b5f98a7adead5782bb8ba1b71f978b8ee9b92a06ceb3b7b430d9288';

// Hardcoded user for demonstration
// In a real application, this would come from a database
const users = [
  {
    id: '1',
    username: 'admin',
    // Password is 'password' hashed with bcrypt
    passwordHash: '$2b$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO'
  }
];

export interface User {
  id: string;
  username: string;
}

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  // Find user by username
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return null;
  }
  
  // Check if password matches
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  console.log(JSON.stringify(user));
  
  if (!isPasswordValid) {
    return null;
  }
  
  // Return user without password hash
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
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