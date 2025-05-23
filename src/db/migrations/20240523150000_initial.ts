import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.bigInteger('github_id').unique().notNullable();
    table.string('github_username').notNullable();
    table.string('email').notNullable();
    table.string('slack_user_id').nullable();
    table.string('slack_username').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['github_id']);
    table.index(['github_username']);
  });

  // Create repositories table
  await knex.schema.createTable('repositories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.bigInteger('github_id').unique().notNullable();
    table.string('name').notNullable();
    table.string('full_name').notNullable();
    table.boolean('private').defaultTo(false);
    table.string('owner_id').notNullable();
    table.enum('owner_type', ['user', 'organization']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['github_id']);
    table.index(['full_name']);
  });

  // Create subscriptions table
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('repository_id').notNullable().references('id').inTable('repositories').onDelete('CASCADE');
    table.string('slack_channel_id').notNullable();
    table.specificType('events', 'text[]').notNullable().defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['user_id', 'repository_id', 'slack_channel_id']);
    table.index(['user_id', 'repository_id']);
  });

  // Create user_mappings table for GitHub to Slack user mappings
  await knex.schema.createTable('user_mappings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('github_username').notNullable();
    table.string('slack_user_id').notNullable();
    table.string('slack_username').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['github_username', 'slack_user_id']);
    table.index(['github_username']);
    table.index(['slack_user_id']);
  });

  // Add function to automatically update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Add triggers to update updated_at automatically
  const tables = ['users', 'repositories', 'subscriptions', 'user_mappings'];
  for (const table of tables) {
    await knex.raw(`
      CREATE TRIGGER update_${table}_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('user_mappings');
  await knex.schema.dropTableIfExists('repositories');
  await knex.schema.dropTableIfExists('users');
  
  // Drop the update_updated_at_column function
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
}
