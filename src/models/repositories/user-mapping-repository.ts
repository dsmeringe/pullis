import { BaseRepository } from './base-repository';
import { UserMapping } from '../types';

export class UserMappingRepository extends BaseRepository<UserMapping> {
  constructor() {
    super('user_mappings');
  }

  async findByGithubUsername(githubUsername: string): Promise<UserMapping | undefined> {
    return this.table.where('github_username', githubUsername).first();
  }

  async findBySlackUserId(slackUserId: string): Promise<UserMapping | undefined> {
    return this.table.where('slack_user_id', slackUserId).first();
  }

  async findBySlackUsername(slackUsername: string): Promise<UserMapping | undefined> {
    return this.table.where('slack_username', slackUsername).first();
  }

  async upsertByGithubUsername(
    githubUsername: string,
    data: Omit<UserMapping, 'id' | 'githubUsername' | 'createdAt' | 'updatedAt'>
  ): Promise<UserMapping> {
    const existingMapping = await this.findByGithubUsername(githubUsername);
    
    if (existingMapping) {
      return this.update(existingMapping.id, {
        slackUserId: data.slackUserId,
        slackUsername: data.slackUsername,
      }) as Promise<UserMapping>;
    }
    
    return this.create({
      githubUsername,
      ...data,
    });
  }
}
