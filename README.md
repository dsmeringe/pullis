# Pullis - GitHub to Slack Notification Service

Pullis is a self-hosted service that delivers GitHub PR notifications to Slack channels in a clean, organized way.

## Features

- Subscribe to GitHub repositories and receive PR notifications in Slack
- Map GitHub usernames to Slack users for better notifications
- Customize which events you want to be notified about
- Easy setup with Docker

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- GitHub App credentials
- Slack App credentials
- Docker (optional)

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/pullis.git
   cd pullis
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Copy the example environment file and update with your configuration
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your GitHub and Slack credentials

5. Initialize the database and run migrations
   ```bash
   npm run db:init
   npm run db:migrate
   ```

6. Generate SSL certificates for local development
   ```bash
   ./scripts/generate-ssl.sh
   ```
   Follow the instructions to trust the self-signed certificate on your system.

7. Update your GitHub App webhook URL to use HTTPS (e.g., `https://your-ngrok-url.ngrok.io/api/github/webhook`)

8. Start the development server
   ```bash
   npm run dev
   ```

### Using ngrok for local development

Since GitHub requires HTTPS for webhooks, you can use ngrok to expose your local server:

1. Install ngrok (if not already installed)
   ```bash
   npm install -g ngrok
   ```

2. Start ngrok (in a new terminal)
   ```bash
   ngrok http 3000
   ```

3. Use the HTTPS URL provided by ngrok in your GitHub App webhook settings

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pullis

# GitHub
GITHUB_APP_ID=your_github_app_id
GITHUB_PRIVATE_KEY=your_github_private_key
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Slack
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
SLACK_APP_TOKEN=xapp-your-slack-app-token

# Frontend (if needed)
FRONTEND_URL=http://localhost:3001

# Security
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3001
```

## Setting up GitHub App

1. Go to GitHub > Settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Set the following permissions:
   - Repository permissions:
     - Pull requests: Read & write
     - Contents: Read-only
     - Metadata: Read-only
4. Subscribe to the following events:
   - Pull request
   - Push
   - Status
5. Set the webhook URL to `http://your-domain.com/api/github/webhook`
6. After creating the app, note the App ID and generate a private key

## Setting up Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App"
3. Add the following bot token scopes:
   - `app_mentions:read`
   - `channels:history`
   - `channels:read`
   - `chat:write`
   - `commands`
   - `im:history`
   - `im:write`
   - `users:read`
4. Install the app to your workspace
5. Note the Bot User OAuth Token and Signing Secret

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run db:init` - Initialize the database
- `npm run db:migrate` - Run database migrations
- `npm run db:rollback` - Rollback the last migration
- `npm run db:make-migration` - Create a new migration file
- `npm run db:seed` - Run database seeds

## Deployment

### With Docker

1. Build the Docker image
   ```bash
   docker build -t pullis .
   ```

2. Run the container
   ```bash
   docker run -d \
     --name pullis \
     -p 3000:3000 \
     --env-file .env \
     pullis
   ```

### With Docker Compose

1. Update the `docker-compose.yml` file with your environment variables

2. Start the services
   ```bash
   docker-compose up -d
   ```

## License

MIT
