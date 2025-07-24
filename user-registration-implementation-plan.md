# User Registration Implementation Plan

## Overview
This document outlines the steps needed to implement user registration functionality in the Neurapath application. The current implementation only supports a hardcoded admin user, which is insufficient for a multi-user application.

## Current State Analysis
- Authentication uses JWT tokens with secure HTTP-only cookies
- User data is currently hardcoded in `src/lib/services/user.service.ts`
- Login form exists but no registration form
- CSRF protection is in place
- Password hashing with bcrypt is implemented

## Required Components

### 1. Registration Page
Create a new route at `/register` with:
- Username input field
- Password input field
- Password confirmation field
- Register button
- Link to login page

### 2. Registration Server Action
Add a new action in `src/routes/login/+page.server.ts` or create a new route at `/register` with:
- Form data validation
- Password strength validation
- Duplicate username checking
- User creation in database
- Password hashing with bcrypt
- Automatic login after registration

### 3. Database Integration
Replace hardcoded users with database storage:
- User table/collection with id, username, passwordHash
- Database service for user operations
- Environment-based database configuration

### 4. Enhanced User Service
Modify `src/lib/services/user.service.ts` to:
- Include user creation functionality
- Database integration for user lookup
- Improved error handling

## Implementation Steps

### Step 1: Create Registration Page Component
File: `src/routes/register/+page.svelte`
- Create registration form UI
- Add form validation
- Include link to login page

### Step 2: Create Registration Server Handler
File: `src/routes/register/+page.server.ts`
- Implement registration action
- Add input validation
- Implement duplicate username checking
- Add user creation logic

### Step 3: Enhance User Service
File: `src/lib/services/user.service.ts`
- Add `createUser` function
- Modify `authenticateUser` to work with database
- Add database connection logic

### Step 4: Add Database Configuration
- Add database connection setup
- Create user table/collection
- Add environment variables for database connection

### Step 5: Update Login Page
- Add link to registration page
- Improve user experience

## Code Implementation Examples

### Registration Page Component
```svelte
<!-- src/routes/register/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  let username = '';
  let password = '';
  let confirmPassword = '';
</script>

<div class="visible modalbox" id="modalbox-register">
  <form method="POST" action="?/register" use:enhance>
    <div class="modalbox-header">
      <img class="modalbox-icon" src="/img/logo.svg" alt="neurapath logo">
      <span class="modalbox-title">Register</span>
    </div>
    <div class="modalbox-content">
      Create a new account to access Eve.
    </div>
    <input class="modalbox-field" name="username" placeholder="Username..." bind:value={username} required>
    <input class="modalbox-field" name="password" type="password" placeholder="Password..." bind:value={password} required>
    <input class="modalbox-field" name="confirmPassword" type="password" placeholder="Confirm Password..." bind:value={confirmPassword} required>
    <button class="modalbox-button" type="submit">Register</button>
    <div class="modalbox-footer">
      <a href="/login">Already have an account? Login</a>
    </div>
  </form>
</div>
```

### Registration Server Action
```typescript
// src/routes/register/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createUser, authenticateUser, generateToken } from '$lib/services/user.service';

export const actions: Actions = {
  register: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');
    const confirmPassword = data.get('confirmPassword');

    // Validation
    if (typeof username !== 'string' || typeof password !== 'string' || typeof confirmPassword !== 'string') {
      return {
        error: 'Invalid input'
      };
    }

    if (password !== confirmPassword) {
      return {
        error: 'Passwords do not match'
      };
    }

    if (password.length < 6) {
      return {
        error: 'Password must be at least 6 characters'
      };
    }

    // Create user
    try {
      const user = await createUser(username, password);
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Set secure cookie
      cookies.set('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 // 1 hour
      });
      
      throw redirect(302, '/');
    } catch (error) {
      return {
        error: error.message || 'Registration failed'
      };
    }
  }
};
```

### Enhanced User Service
```typescript
// src/lib/services/user.service.ts (enhanced)
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { databaseService } from './database.service'; // New database service

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface User {
  id: string;
  username: string;
}

// Remove hardcoded users

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // Find user by username from database
    const user = await databaseService.getUserByUsername(username);
    
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
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

export const createUser = async (username: string, password: string): Promise<User> => {
  // Check if user already exists
  const existingUser = await databaseService.getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Create user in database
  const user = await databaseService.createUser({
    username,
    passwordHash
  });
  
  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
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
```

## Security Considerations

### Password Security
- Use bcrypt with appropriate salt rounds
- Implement password strength requirements
- Add rate limiting for registration attempts

### Input Validation
- Sanitize all user inputs
- Validate username format (alphanumeric, length limits)
- Validate password complexity

### Session Security
- Maintain secure HTTP-only cookies
- Implement proper session expiration
- Add session invalidation on password change

### CSRF Protection
- Leverage SvelteKit's built-in CSRF protection
- Ensure all forms use proper action handlers

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables
Add to `.env` file:
```
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secure_jwt_secret
```

## Testing Requirements

### Unit Tests
- User creation function
- Password hashing
- Token generation and verification
- Authentication logic

### Integration Tests
- Registration flow
- Login flow
- Protected route access
- Session management

### Security Tests
- SQL injection attempts
- XSS attempts
- Brute force protection
- Password strength enforcement

## Deployment Considerations

### Production Security
- Use strong JWT secret in production
- Enable secure cookies in production
- Implement proper database connection pooling
- Add monitoring for authentication attempts

### Performance
- Add database indexing on username field
- Implement connection pooling
- Cache frequently accessed user data

## Future Enhancements

### Account Management
- Password reset functionality
- Email verification
- User profile management
- Account deletion

### Advanced Security
- Two-factor authentication
- Account lockout after failed attempts
- Session management dashboard
- Password history tracking

## Timeline
1. **Week 1**: Registration page and server action
2. **Week 2**: Database integration and user service enhancements
3. **Week 3**: Testing and security validation
4. **Week 4**: Documentation and deployment

## Success Metrics
- Successful user registration and login
- No security vulnerabilities
- Good performance under load
- Positive user experience feedback