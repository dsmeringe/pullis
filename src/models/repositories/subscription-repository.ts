import { BaseRepository } from './base-repository';
import { Subscription } from '../types';

export class SubscriptionRepository extends BaseRepository<Subscription> {
  constructor() {
    super('subscriptions');
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    return this.table.where('user_id', userId);
  }

  async findByRepositoryId(repositoryId: string): Promise<Subscription[]> {
    return this.table.where('repository_id', repositoryId);
  }

  async findBySlackChannel(slackChannelId: string): Promise<Subscription[]> {
    return this.table.where('slack_channel_id', slackChannelId);
  }

  async findForUserAndRepository(userId: string, repositoryId: string): Promise<Subscription | undefined> {
    return this.table.where({ user_id: userId, repository_id: repositoryId }).first();
  }

  async findForUserRepositoryAndChannel(
    userId: string,
    repositoryId: string,
    slackChannelId: string
  ): Promise<Subscription | undefined> {
    return this.table
      .where({
        user_id: userId,
        repository_id: repositoryId,
        slack_channel_id: slackChannelId,
      })
      .first();
  }

  async updateSubscriptionEvents(
    subscriptionId: string,
    events: string[]
  ): Promise<Subscription | undefined> {
    return this.update(subscriptionId, { events });
  }

  async toggleSubscription(
    subscriptionId: string,
    isActive: boolean
  ): Promise<Subscription | undefined> {
    return this.update(subscriptionId, { is_active: isActive });
  }
}
