import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { TOKEN_COOKIE } from './constants';
import { env } from './env';
import { authRoutes } from './routes/auth';
import { entryRoutes } from './routes/entries';
import { analyticsRoutes } from './routes/analytics';
import { accountRoutes } from './routes/account';

export async function buildApp() {
  const app = Fastify({
    logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug', redact: ['req.headers.cookie'] },
    // Atrás dos proxies da Vercel e do Render: usa o IP real do usuário (X-Forwarded-For) no limite de requisições
    trustProxy: true,
  });

  await app.register(helmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } });
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: TOKEN_COOKIE, signed: false },
    sign: { expiresIn: '7d' },
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      message: 'Muitas requisições. Aguarde alguns instantes e tente novamente.',
    }),
  });

  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw Object.assign(new Error('Sessão expirada ou inválida. Faça login novamente.'), { statusCode: 401 });
    }
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: error.issues[0]?.message ?? 'Dados inválidos.',
        issues: error.flatten().fieldErrors,
      });
    }
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    if (statusCode < 500) {
      return reply.code(statusCode).send({ message: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ message: 'Erro interno do servidor.' });
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(entryRoutes, { prefix: '/entries' });
  await app.register(analyticsRoutes, { prefix: '/analytics' });
  await app.register(accountRoutes, { prefix: '/account' });

  return app;
}
