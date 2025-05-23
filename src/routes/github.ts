import Router from '@koa/router';
import { handleGitHubWebhook } from '../services/github';
import { logger } from '../utils/logger';

const router = new Router({
  prefix: '/api/github',
});

// Webhook endpoint for GitHub
router.post('/webhook', async (ctx) => {
  await handleGitHubWebhook(ctx);
});

// Get installation URL for the GitHub App
router.get('/install', async (ctx) => {
  try {
    // TODO: Generate installation URL based on the user's GitHub account
    const installUrl = `https://github.com/apps/${process.env.GITHUB_APP_SLUG || 'your-app-slug'}/installations/new`;
    
    ctx.body = {
      installUrl,
    };
  } catch (error) {
    logger.error('Failed to generate GitHub installation URL', { error });
    ctx.status = 500;
    ctx.body = { error: 'Failed to generate installation URL' };
  }
});

// Get repositories for the authenticated user
router.get('/repositories', async (ctx) => {
  try {
    // TODO: Implement repository listing for the authenticated user
    // This would require GitHub OAuth or using the installation token
    ctx.body = { repositories: [] };
  } catch (error) {
    logger.error('Failed to fetch repositories', { error });
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch repositories' };
  }
});

export default router;
