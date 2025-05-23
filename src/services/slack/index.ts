import { App, Block, KnownBlock, LogLevel } from '@slack/bolt';
import config from '../../config';
import { logger } from '../../utils/logger';
import { UserMappingRepository } from '../../models/repositories';

export class SlackService {
  private app: App;
  private userMappingRepository: UserMappingRepository;

  constructor() {
    this.app = new App({
      token: config.slack.botToken,
      signingSecret: config.slack.signingSecret,
      appToken: config.slack.appToken,
      socketMode: true,
      logLevel: LogLevel.DEBUG,
    });

    this.userMappingRepository = new UserMappingRepository();
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle app mention events
    this.app.event('app_mention', async ({ event, say }) => {
      try {
        logger.info('Received app_mention event', { event });
        await say(`Hello, <@${event.user}>! I'm Pullis, your GitHub notification bot.`);
      } catch (error) {
        logger.error('Error handling app_mention', { error });
      }
    });

    // Handle direct messages
    this.app.event('message', async ({ event, say }) => {
      // Skip if the message is from a bot or a message_changed event
      if (event.subtype === 'bot_message' || event.subtype === 'message_changed') {
        return;
      }

      try {
        logger.info('Received direct message', { event });
        
        // Only respond to direct messages (no channel in the event means it's a DM)
        if (event.channel_type === 'im') {
          await say({
            text: 'Hi there! Here are some things you can do:',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '*Hi there!* :wave: I\'m Pullis, your GitHub notification bot. Here\'s what you can do:',
                },
              },
              {
                type: 'divider',
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '• `/subscribe` - Subscribe to GitHub repository updates\n' +
                        '• `/unsubscribe` - Unsubscribe from repository updates\n' +
                        '• `/list` - List your current subscriptions\n' +
                        '• `/map-user` - Map your GitHub username to your Slack account',
                },
              },
            ],
          });
        }
      } catch (error) {
        logger.error('Error handling direct message', { error });
      }
    });

    // Handle errors
    this.app.error((error) => {
      logger.error('Slack app error', { error });
    });
  }

  // Send a notification to a Slack channel
  public async sendNotification(
    channelId: string,
    message: string,
    blocks?: (KnownBlock | Block)[]
  ): Promise<void> {
    try {
      await this.app.client.chat.postMessage({
        channel: channelId,
        text: message,
        blocks,
      });
      logger.info('Notification sent to Slack', { channelId });
    } catch (error) {
      logger.error('Failed to send notification to Slack', { error, channelId });
      throw error;
    }
  }

  // Format and send a PR notification
  public async sendPRNotification(
    channelId: string,
    pr: {
      action: string;
      number: number;
      title: string;
      url: string;
      author: string;
      authorAvatar?: string;
      repository: string;
      body?: string;
      additions?: number;
      deletions?: number;
      changedFiles?: number;
    }
  ): Promise<void> {
    const actionText = this.getActionText(pr.action);
    const authorText = await this.formatMention(pr.author);
    
    const blocks: (KnownBlock | Block)[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${pr.url}|${pr.repository}#${pr.number}: ${pr.title}>*`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View PR',
            emoji: true,
          },
          url: pr.url,
          action_id: 'view_pr',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `:git-pull-request: *${actionText}* by ${authorText} in *${pr.repository}*`,
          },
        ],
      },
    ];

    if (pr.body) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${pr.body.substring(0, 200)}${pr.body.length > 200 ? '...' : ''}`,
        },
      });
    }

    if (pr.additions !== undefined && pr.deletions !== undefined && pr.changedFiles !== undefined) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `:heavy_plus_sign: ${pr.additions} | :heavy_minus_sign: ${pr.deletions} | :file_folder: ${pr.changedFiles} files`,
          },
        ],
      });
    }

    await this.sendNotification(
      channelId,
      `${actionText}: ${pr.repository}#${pr.number} by ${pr.author} - ${pr.title}`,
      blocks
    );
  }

  // Format a GitHub username to a Slack mention if a mapping exists
  private async formatMention(githubUsername: string): Promise<string> {
    try {
      const mapping = await this.userMappingRepository.findByGithubUsername(githubUsername);
      if (mapping) {
        return `<@${mapping.slackUserId}>`;
      }
      return `*${githubUsername}*`;
    } catch (error) {
      logger.error('Error formatting mention', { error, githubUsername });
      return `*${githubUsername}*`;
    }
  }

  // Map action to user-friendly text
  private getActionText(action: string): string {
    const actionMap: Record<string, string> = {
      opened: 'New pull request',
      closed: 'Pull request closed',
      reopened: 'Pull request reopened',
      merged: 'Pull request merged',
      review_requested: 'Review requested',
      review_request_removed: 'Review request removed',
      ready_for_review: 'Ready for review',
      converted_to_draft: 'Converted to draft',
      labeled: 'Label added',
      unlabeled: 'Label removed',
      assigned: 'Assigned',
      unassigned: 'Unassigned',
      synchronize: 'New commits pushed',
    };

    return actionMap[action] || `Pull request ${action}`;
  }

  // Start the Slack app
  public async start(port?: number): Promise<void> {
    try {
      await this.app.start(port || 3000);
      logger.info(`Slack app is running on port ${port || 3000}`);
    } catch (error) {
      logger.error('Failed to start Slack app', { error });
      throw error;
    }
  }
}

// Export a singleton instance
export const slackService = new SlackService();

// Export the Slack app for use in the main application
export const initSlackApp = async (port?: number): Promise<void> => {
  await slackService.start(port);
};
