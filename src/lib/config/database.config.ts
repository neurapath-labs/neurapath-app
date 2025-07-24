
// export const databaseConfig = {
//   // In a real application, these would come from environment variables
//   // For now, we're using in-memory storage for simplicity
//   type: 'memory', // 'memory' | 'sqlite' | 'postgresql' | 'mysql'
  
//   // SQLite configuration (if type is 'sqlite')
//   sqlite: {
//     filename: process.env.SQLITE_FILENAME || './database.sqlite'
//   },
  
//   // PostgreSQL configuration (if type is 'postgresql')
//   postgresql: {
//     host: process.env.POSTGRES_HOST || 'localhost',
//     port: parseInt(process.env.POSTGRES_PORT || '5432'),
//     database: process.env.POSTGRES_DB || 'neurapath',
//     username: process.env.POSTGRES_USER || 'neurapath',
//     password: process.env.POSTGRES_PASSWORD || 'neurapath'
//   },
  
//   // MySQL configuration (if type is 'mysql')
//   mysql: {
//     host: process.env.MYSQL_HOST || 'localhost',
//     port: parseInt(process.env.MYSQL_PORT || '3306'),
//     database: process.env.MYSQL_DB || 'neurapath',
//     username: process.env.MYSQL_USER || 'neurapath',
//     password: process.env.MYSQL_PASSWORD || 'neurapath'
//   }
// };