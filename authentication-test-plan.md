# Authentication Test Plan

## Overview
This test plan outlines the testing strategy for the application's user registration and login functionality. Due to the current implementation lacking registration features, this plan includes both current capabilities and future implementation testing.

## Test Environment
- Application URL: http://localhost:5173/
- Browser: Latest Chrome, Firefox, or Safari
- Prerequisites: Application running locally with `npm run dev`

## Test Scenarios

### Login Functionality

#### TC01: Successful Login
**Preconditions**: 
- Application is running
- Hardcoded admin user exists

**Steps**:
1. Navigate to http://localhost:5173/
2. Verify redirect to login page
3. Enter username: "admin"
4. Enter password: "password"
5. Click "Login!" button

**Expected Results**:
- User is redirected to home page
- JWT token is stored in secure cookie
- User can access authenticated areas

#### TC02: Invalid Credentials
**Preconditions**: 
- Application is running

**Steps**:
1. Navigate to http://localhost:5173/login
2. Enter invalid username: "invalid"
3. Enter password: "wrong"
4. Click "Login!" button

**Expected Results**:
- Error message displayed: "Invalid credentials"
- User remains on login page
- No authentication cookie is set

#### TC03: Empty Fields
**Preconditions**: 
- Application is running

**Steps**:
1. Navigate to http://localhost:5173/login
2. Leave username field empty
3. Leave password field empty
4. Click "Login!" button

**Expected Results**:
- Error message displayed: "Invalid input"
- User remains on login page

### Registration Functionality (To Be Implemented)

#### TC04: Successful Registration
**Preconditions**: 
- Registration feature is implemented
- Application is running

**Steps**:
1. Navigate to http://localhost:5173/register (or login page with registration option)
2. Enter valid username
3. Enter valid password
4. Confirm password
5. Click "Register" button

**Expected Results**:
- User account is created in database
- User is redirected to login page or automatically logged in
- Success message is displayed

#### TC05: Duplicate Username
**Preconditions**: 
- Registration feature is implemented
- Username "testuser" already exists

**Steps**:
1. Navigate to registration page
2. Enter existing username: "testuser"
3. Enter valid password
4. Confirm password
5. Click "Register" button

**Expected Results**:
- Error message displayed: "Username already exists"
- User remains on registration page
- No account is created

#### TC06: Password Validation
**Preconditions**: 
- Registration feature is implemented with password requirements

**Steps**:
1. Navigate to registration page
2. Enter valid username
3. Enter weak password: "123"
4. Confirm password
5. Click "Register" button

**Expected Results**:
- Error message displayed with password requirements
- User remains on registration page
- No account is created

### Authentication Flow

#### TC07: Access to Protected Routes
**Preconditions**: 
- User is logged in

**Steps**:
1. Navigate to authenticated routes (e.g., /dashboard)
2. Verify content is accessible

**Expected Results**:
- Protected content is displayed
- No redirect to login page

#### TC08: Access Without Authentication
**Preconditions**: 
- User is not logged in

**Steps**:
1. Directly navigate to authenticated routes (e.g., /dashboard)

**Expected Results**:
- Redirect to login page
- Access denied to protected content

#### TC09: Session Expiration
**Preconditions**: 
- User is logged in
- JWT token expires (1 hour)

**Steps**:
1. Wait for token expiration
2. Attempt to access authenticated content

**Expected Results**:
- Redirect to login page
- Session is cleared

## Automated Testing Strategy

### Browser Automation
Due to CSRF protection, manual browser testing is recommended for initial validation. For automated testing:

1. **Tool**: Playwright or Cypress
2. **Approach**: 
   - Launch browser instance
   - Navigate to login page
   - Extract CSRF token from form
   - Submit form with valid credentials
   - Verify authentication state
   - Test protected routes

### API Testing
For backend validation:

1. **Tool**: Jest with Supertest
2. **Endpoints to Test**:
   - POST /login
   - User service functions
   - JWT token generation/validation

## Test Data

### Valid Test Users
- Admin User: admin / password

### Invalid Test Data
- Invalid username: "nonexistent"
- Invalid password: "wrongpassword"
- Empty fields: "", ""
- Malformed input: SQL injection attempts, XSS attempts

## Success Criteria
- All login scenarios work as expected
- Security measures are properly implemented
- Error handling is appropriate
- User experience is smooth
- Registration functionality (when implemented) meets requirements

## Reporting
- Document all test results
- Report any security vulnerabilities
- Log any unexpected behavior
- Provide screenshots for UI-related issues