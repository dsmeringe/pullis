#!/usr/bin/env ts-node
import { db } from '../src/db';
import { logger } from '../src/utils/logger';

async function initDatabase() {
  try {
    logger.info('Initializing database...');
    
    // Enable UUID extension
    await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await db.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database', { error });
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

initDatabase();
