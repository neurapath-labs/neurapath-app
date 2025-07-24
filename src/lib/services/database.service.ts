const BASE_URL = "https://production.eveapp2021.workers.dev/";

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