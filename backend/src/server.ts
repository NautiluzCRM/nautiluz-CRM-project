import './config/env.js';
import { httpServer } from './app.js';
import { connectMongo } from './database/mongoose.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function bootstrap() {
  await connectMongo();
  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
