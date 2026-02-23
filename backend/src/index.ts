import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { env } from './config/env';
import authPlugin from './plugins/auth';
import realtimePlugin from './plugins/realtime';
import { authRoutes } from './routes/auth';
import { messagingRoutes } from './routes/messaging';
import { adminRoutes } from './routes/admin';
import { fileRoutes } from './routes/files';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(sensible);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"]
      }
    },
    hsts: true
  });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await app.register(cookie);
  await app.register(jwt, { secret: env.JWT_ACCESS_SECRET });
  await app.register(authPlugin);
  await app.register(realtimePlugin);

  app.get('/api/health', async () => ({ ok: true }));
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(messagingRoutes, { prefix: '/api' });
  await app.register(adminRoutes, { prefix: '/api' });
  await app.register(fileRoutes, { prefix: '/api' });

  return app;
}

if (require.main === module) {
  buildApp()
    .then((app) => app.listen({ host: '0.0.0.0', port: env.PORT }))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
