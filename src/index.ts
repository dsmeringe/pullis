import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { createServer, Server } from 'http';
import { initDb } from './db';
import { initSlackApp } from './services/slack';
import { initGitHubWebhooks } from './services/github';
import { router } from './routes';
import config from './config';
import { logger } from './utils/logger';

class App {
  private app: Koa;
  private server: Server;

  constructor() {
    this.app = new Koa();
    this.server = createServer(this.app.callback());
    
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  private initializeMiddleware(): void {
    // Error handling
    this.app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err: any) {
        ctx.status = err.status || 500;
        ctx.body = {
          error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
          },
        };
        
        if (ctx.status >= 500) {
          logger.error('Server error', { error: err, url: ctx.url });
        }
      }
    });

    // CORS
    this.app.use(
      cors({
        origin: config.cors.origin,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      })
    );

    // Body parser
    this.app.use(bodyParser({
      enableTypes: ['json'],
      jsonLimit: '10mb',
    }));

    // Logger
    this.app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      logger.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use(router.routes());
    this.app.use(router.allowedMethods());

    // Health check
    this.app.use(async (ctx) => {
      if (ctx.path === '/health') {
        ctx.body = { status: 'ok' };
      }
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await initDb();
      
      // Initialize Slack app
      await initSlackApp();
      
      // Initialize GitHub webhooks
      githubService.initializeWebhooks(this.server);
      
      // Start server
      this.server.listen(this.port, () => {
        logger.info(`Server running on port ${this.port}`);
      });
    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }
}

// Start the application
const app = new App();
app.start().catch((error) => {
  logger.error('Application error', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
