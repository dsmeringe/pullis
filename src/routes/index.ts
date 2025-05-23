import Router from '@koa/router';
import githubRouter from './github';
import slackRouter from './slack';

const router = new Router();

// Health check endpoint
router.get('/health', (ctx) => {
  ctx.body = { status: 'ok' };
});

// API routes
router.use('/api', githubRouter.routes(), githubRouter.allowedMethods());
router.use('/api', slackRouter.routes(), slackRouter.allowedMethods());

export { router };
