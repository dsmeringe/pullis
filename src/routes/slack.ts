import Router from '@koa/router';
import { slackService } from '../services/slack';
import { SubscriptionRepository, UserMappingRepository } from '../models/repositories';
import { logger } from '../utils/logger';

const router = new Router({
  prefix: '/api/slack',
});

// Handle Slack commands
router.post('/commands', async (ctx) => {
  const { command, text, user_id, channel_id, response_url } = ctx.request.body as {
    command: string;
    text: string;
    user_id: string;
    channel_id: string;
    response_url: string;
  };

  try {
    logger.info('Received Slack command', { command, text, user_id, channel_id });

    // Acknowledge the command immediately
    ctx.status = 200;

    // Process the command in the background
    process.nextTick(async () => {
      try {
        switch (command) {
          case '/subscribe':
            await handleSubscribe(user_id, channel_id, text, response_url);
            break;
          case '/unsubscribe':
            await handleUnsubscribe(user_id, channel_id, text, response_url);
            break;
          case '/list':
            await handleListSubscriptions(user_id, channel_id, response_url);
            break;
          case '/map-user':
            await handleMapUser(user_id, text, response_url);
            break;
          default:
            await sendSlackResponse(response_url, {
              text: `Unknown command: ${command}`,
            });
        }
      } catch (error) {
        logger.error('Error processing Slack command', { error });
        await sendSlackResponse(response_url, {
          text: 'An error occurred while processing your command. Please try again later.',
        });
      }
    });
  } catch (error) {
    logger.error('Error handling Slack command', { error });
    ctx.status = 500;
    ctx.body = 'An error occurred while processing your command.';
  }
});

// Helper function to send a response to a Slack command
async function sendSlackResponse(responseUrl: string, message: any): Promise<void> {
  await fetch(responseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

// Command handlers
async function handleSubscribe(
  userId: string,
  channelId: string,
  repoFullName: string,
  responseUrl: string
): Promise<void> {
  // TODO: Implement subscription logic
  await sendSlackResponse(responseUrl, {
    text: `Subscribing to ${repoFullName} in this channel.`,
  });
}

async function handleUnsubscribe(
  userId: string,
  channelId: string,
  repoFullName: string,
  responseUrl: string
): Promise<void> {
  // TODO: Implement unsubscription logic
  await sendSlackResponse(responseUrl, {
    text: `Unsubscribing from ${repoFullName} in this channel.`,
  });
}

async function handleListSubscriptions(
  userId: string,
  channelId: string,
  responseUrl: string
): Promise<void> {
  // TODO: Implement list subscriptions logic
  await sendSlackResponse(responseUrl, {
    text: 'Your current subscriptions in this channel:',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Your current subscriptions in this channel:*\n• owner1/repo1\n• owner2/repo2',
        },
      },
    ],
  });
}

async function handleMapUser(
  userId: string,
  githubUsername: string,
  responseUrl: string
): Promise<void> {
  try {
    // Get the user's Slack username
    const userInfo = await slackService.app.client.users.info({
      user: userId,
    });

    const slackUsername = userInfo.user?.name || userId;
    
    // TODO: Save the mapping to the database
    await sendSlackResponse(responseUrl, {
      text: `Mapped GitHub user @${githubUsername} to Slack user @${slackUsername}.`,
    });
  } catch (error) {
    logger.error('Error mapping user', { error });
    await sendSlackResponse(responseUrl, {
      text: 'An error occurred while mapping your GitHub username. Please try again later.',
    });
  }
}

export default router;
