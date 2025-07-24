const BASE_URL = "https://neurapath-backend.neurapath.workers.dev/";
import type { Database, User, UserWithPasswordHash } from '$lib/models';
import { databaseConfig } from '$lib/config/database.config';

// In-memory storage for users (in a real app, this would be a database)
let users: UserWithPasswordHash[] = [
  {
    id: '1',
    username: 'admin',
    // Password is 'password' hashed with bcrypt
    passwordHash: '$2b$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO'
  }
];

export const getPublicDatabases = async (): Promise<Database[]> => {
  try {
    // Get username and password from localforage
    const username = await localforage.getItem<string>('username');
    const password = await localforage.getItem<string>('password');

    // Check if username and password exist
    if (!username || !password) {
      console.error('Username or password not found in local storage');
      // Return sample data for testing
      return [
        { id: '1', name: 'Sample Database 1' },
        { id: '2', name: 'Sample Database 2' },
        { id: '3', name: 'Sample Database 3' }
      ];
    }

    // Create headers with Basic authentication
    const headers = new Headers();
    headers.append('Authorization', `Basic ${username}:${password}`);

    // Set up request options
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: headers
    };

    // Make the API call
    const response = await fetch('https://neurapath-backend.neurapath.workers.dev/public/data', requestOptions);
    const data = await response.json();

    // Check for error in response
    if (data.error && data.error === 403) {
      console.error('Access forbidden when fetching public databases');
      return [];
    }

    // Return the databases array or empty array if not present
    return data.databases || [];
  } catch (error) {
    console.error('Error fetching public databases:', error);
    // Return sample data for testing
    return [
      { id: '1', name: 'Sample Database 1' },
      { id: '2', name: 'Sample Database 2' },
      { id: '3', name: 'Sample Database 3' }
    ];
  }
};

export const getDatabaseByID = async (id: string) => {
  try {
    const response = await fetch(`${BASE_URL}${id}.json`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return {};
  } catch (error) {
    console.error('Error fetching database:', error);
    throw new Error('Failed to fetch database');
  }
};

export const createRecord = async (id: string, record: any) => {
  try {
    const response = await fetch(`${BASE_URL}${id}.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    throw new Error('Failed to create record');
  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
};

export const updateRecord = async (id: string, record: any) => {
  try {
    const response = await fetch(`${BASE_URL}${id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    throw new Error('Failed to update record');
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
};

export const deleteRecord = async (id: string) => {
  try {
    const response = await fetch(`${BASE_URL}${id}.json`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return true;
    }
    throw new Error('Failed to delete record');
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
};

export const updateDatabase = async (id: string, database: any) => {
  try {
    const response = await fetch(`${BASE_URL}${id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(database),
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    throw new Error('Failed to update database');
  } catch (error) {
    console.error('Error updating database:', error);
    throw error;
  }
};

// User-related functions
export const getUserByUsername = async (username: string): Promise<UserWithPasswordHash | null> => {
  // In a real app, this would query the database
  // For now, we're using in-memory storage
  const user = users.find(u => u.username === username);
  return user || null;
};

export const createUser = async (user: Omit<UserWithPasswordHash, 'id'>): Promise<UserWithPasswordHash> => {
  // In a real app, this would insert into the database
  // For now, we're using in-memory storage
  const newUser = {
    id: String(users.length + 1),
    ...user
  };
  users.push(newUser);
  return newUser;
};