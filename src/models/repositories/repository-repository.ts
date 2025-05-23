import { BaseRepository } from './base-repository';
import { Repository } from '../types';

export class RepositoryRepository extends BaseRepository<Repository> {
  constructor() {
    super('repositories');
  }

  async findByGithubId(githubId: number): Promise<Repository | undefined> {
    return this.table.where('github_id', githubId).first();
  }

  async findByFullName(fullName: string): Promise<Repository | undefined> {
    return this.table.where('full_name', fullName).first();
  }

  async findByOwner(ownerId: string, ownerType: 'user' | 'organization'): Promise<Repository[]> {
    return this.table.where({ owner_id: ownerId, owner_type: ownerType });
  }

  async upsertByGithubId(data: Omit<Repository, 'id' | 'createdAt' | 'updatedAt'>): Promise<Repository> {
    const existingRepo = await this.findByGithubId(data.githubId);
    
    if (existingRepo) {
      return this.update(existingRepo.id, {
        name: data.name,
        fullName: data.fullName,
        private: data.private,
      }) as Promise<Repository>;
    }
    
    return this.create(data);
  }
}
