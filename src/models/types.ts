import { Knex } from 'knex';

export interface User {
  id: string;
  githubId: number;
  githubUsername: string;
  email: string;
  slackUserId?: string;
  slackUsername?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Repository {
  id: string;
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  ownerId: string;
  ownerType: 'user' | 'organization';
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  repositoryId: string;
  slackChannelId: string;
  events: string[]; // e.g., ['pull_request.opened', 'pull_request.closed']
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMapping {
  id: string;
  githubUsername: string;
  slackUserId: string;
  slackUsername: string;
  createdAt: Date;
  updatedAt: Date;
}

// Knex type extensions
declare module 'knex/types/tables' {
  interface Tables {
    users: Knex.CompositeTableType<User>;
    repositories: Knex.CompositeTableType<Repository>;
    subscriptions: Knex.CompositeTableType<Subscription>;
    user_mappings: Knex.CompositeTableType<UserMapping>;
  }
}
