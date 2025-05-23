import { BaseRepository } from './base-repository';
import { User } from '../types';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByGithubId(githubId: number): Promise<User | undefined> {
    return this.table.where('github_id', githubId).first();
  }

  async findByGithubUsername(githubUsername: string): Promise<User | undefined> {
    return this.table.where('github_username', githubUsername).first();
  }

  async findBySlackId(slackUserId: string): Promise<User | undefined> {
    return this.table.where('slack_user_id', slackUserId).first();
  }

  async upsertByGithubId(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const existingUser = await this.findByGithubId(data.githubId);
    
    if (existingUser) {
      return this.update(existingUser.id, {
        githubUsername: data.githubUsername,
        email: data.email,
      }) as Promise<User>;
    }
    
    return this.create(data);
  }
}
