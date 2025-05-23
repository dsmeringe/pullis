import { Webhooks } from '@octokit/webhooks';
import { App } from '@octokit/app';
import { Context } from 'koa';
import config from '../../config';
import { logger } from '../../utils/logger';
import { UserRepository, RepositoryRepository, SubscriptionRepository } from '../../models/repositories';

export class GitHubService {
  private webhooks: Webhooks;
  private app: App;
  private userRepository: UserRepository;
  private repositoryRepository: RepositoryRepository;
  private subscriptionRepository: SubscriptionRepository;

  constructor() {
    this.webhooks = new Webhooks({
      secret: config.github.webhookSecret,
    });
    
    this.app = new App({
      appId: config.github.appId,
      privateKey: config.github.privateKey,
      webhooks: {
        secret: config.github.webhookSecret,
      },
    });
    
    this.userRepository = new UserRepository();
    this.repositoryRepository = new RepositoryRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    
    this.setupWebhookHandlers();
  }

  private setupWebhookHandlers(): void {
    // Handle pull request events
    this.webhooks.on('pull_request', async (event) => {
      const { action, repository, pull_request, sender } = event.payload;
      
      try {
        logger.info(`Pull request ${action} for ${repository.full_name}#${pull_request.number}`, {
          action,
          repository: repository.full_name,
          pr: pull_request.number,
          author: sender.login,
        });

        // Find the repository in our database
        const repo = await this.repositoryRepository.findByGithubId(repository.id);
        if (!repo) {
          logger.debug(`Repository ${repository.full_name} not found in database, skipping`);
          return;
        }

        // Find all subscriptions for this repository
        const subscriptions = await this.subscriptionRepository.findByRepositoryId(repo.id);
        if (subscriptions.length === 0) {
          logger.debug(`No subscriptions found for repository ${repository.full_name}, skipping`);
          return;
        }

        // Process each subscription
        for (const subscription of subscriptions) {
          if (!subscription.isActive) continue;
          
          // Check if this event type is subscribed to
          if (!subscription.events.includes(`pull_request.${action}`)) {
            continue;
          }

          // TODO: Send notification to Slack
          logger.info(`Would send notification to Slack channel ${subscription.slackChannelId}`, {
            event: `pull_request.${action}`,
            repository: repository.full_name,
            pr: pull_request.number,
          });
        }
      } catch (error) {
        logger.error('Error processing pull request webhook', { error });
      }
    });

    // Handle installation events (app installed/uninstalled)
    this.webhooks.on('installation', async (event) => {
      const { action, installation, repositories, sender } = event.payload;
      
      try {
        logger.info(`GitHub App ${action} event`, {
          action,
          installationId: installation.id,
          sender: sender.login,
          repositoryCount: repositories?.length || 0,
        });

        // TODO: Handle app installation/uninstallation
        // - Create/update user record
        // - Create/update repository records
        // - Set up initial subscriptions
      } catch (error) {
        logger.error('Error processing installation webhook', { error });
      }
    });
  }

  // Middleware to handle incoming webhooks
  public async handleWebhook(ctx: Context): Promise<void> {
    const { headers, rawBody } = ctx.request as any;
    
    try {
      // Verify the webhook signature
      await this.webhooks.verifyAndReceive({
        id: headers['x-github-delivery'],
        name: headers['x-github-event'] as any,
        signature: headers['x-hub-signature-256'],
        payload: rawBody,
      });
      
      ctx.status = 200;
      ctx.body = { status: 'ok' };
    } catch (error) {
      logger.error('Webhook verification failed', { error });
      ctx.status = 400;
      ctx.body = { error: 'Webhook verification failed' };
    }
  }

  // Get an installation access token
  public async getInstallationToken(installationId: number): Promise<string> {
    try {
      const { token } = await this.app.getInstallationOctokit(installationId).rest.apps.createInstallationAccessToken({
        installation_id: installationId,
      });
      
      return token;
    } catch (error) {
      logger.error('Failed to get installation token', { error });
      throw new Error('Failed to get installation token');
    }
  }

  // Initialize webhooks with the HTTP server
  public initializeWebhooks(server: Server): void {
    this.webhooks.mount({
      path: '/api/github/webhook',
      createMiddleware: (options) => {
        return async (req, res, next) => {
          try {
            // Handle the webhook event
            await this.webhooks.receive({
              id: req.headers['x-github-delivery'] as string,
              name: req.headers['x-github-event'] as string,
              payload: req.body,
              signature: req.headers['x-hub-signature-256'] as string,
            });
            res.statusCode = 200;
            res.end('ok');
          } catch (error) {
            logger.error('Error processing webhook', { error });
            res.statusCode = 500;
            res.end('Error processing webhook');
          }
        };
      },
    });
  }
}

// Export a singleton instance
export const githubService = new GitHubService();

// Export webhook handler for Koa
export const handleGitHubWebhook = githubService.handleWebhook.bind(githubService);
