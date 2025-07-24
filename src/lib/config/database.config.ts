import { SQLITE_FILENAME, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_DB, MYSQL_USER, MYSQL_PASSWORD } from '$env/static/private';

export const databaseConfig = {
    // In a real application, these would come from environment variables
    // For now, we're using in-memory storage for simplicity
    type: 'memory', // 'memory' | 'sqlite' | 'postgresql' | 'mysql'
  
    // SQLite configuration (if type is 'sqlite')
    sqlite: {
        filename: SQLITE_FILENAME || './database.sqlite'
    },
  
    // PostgreSQL configuration (if type is 'postgresql')
    postgresql: {
        host: POSTGRES_HOST || 'localhost',
        port: parseInt(POSTGRES_PORT || '5432'),
        database: POSTGRES_DB || 'neurapath',
        username: POSTGRES_USER || 'neurapath',
        password: POSTGRES_PASSWORD || 'neurapath'
    },
  
    // MySQL configuration (if type is 'mysql')
    mysql: {
        host: MYSQL_HOST || 'localhost',
        port: parseInt(MYSQL_PORT || '3306'),
        database: MYSQL_DB || 'neurapath',
        username: MYSQL_USER || 'neurapath',
        password: MYSQL_PASSWORD || 'neurapath'
    }
};