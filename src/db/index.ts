import knex from 'knex';
import config from '../config';
import { logger } from '../utils/logger';

// Initialize Knex instance
export const db = knex({
  client: 'pg',
  connection: config.database.url,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './src/db/migrations',
    tableName: 'knex_migrations',
  },
  debug: config.nodeEnv === 'development',
});

// Initialize database connection
export const initDb = async (): Promise<void> => {
  try {
    // Test the database connection
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
    
    // Run migrations
    await db.migrate.latest();
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDb = async (): Promise<void> => {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', error);
    throw error;
  }
};

export default db;
