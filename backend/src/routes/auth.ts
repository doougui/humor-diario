import type { FastifyInstance, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { env } from '../env';
import { ROLES, TOKEN_COOKIE } from '../constants';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(80),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72),
  role: z.enum(ROLES),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade para continuar.' }),
  }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    consentAt: user.consentAt,
    createdAt: user.createdAt,
    isAdmin: env.ADMIN_EMAILS.includes(user.email),
  };
}

const cookieOptions = {
  path: '/',
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  // O frontend repassa as chamadas para a API pelo mesmo domínio, então o cookie é primário
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7,
};

async function startSession(reply: FastifyReply, user: User) {
  const token = await reply.jwtSign({ sub: user.id });
  reply.setCookie(TOKEN_COOKIE, token, cookieOptions);
}

export function clearSession(reply: FastifyReply) {
  reply.clearCookie(TOKEN_COOKIE, { path: '/' });
}

export async function authRoutes(app: FastifyInstance) {
  // Limite mais rígido nas rotas de autenticação para dificultar ataques de força bruta
  const authRateLimit = { rateLimit: { max: 10, timeWindow: '15 minutes' } };

  app.post('/register', { config: authRateLimit }, async (request, reply) => {
    const data = registerSchema.parse(request.body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return reply.code(409).send({ message: 'Já existe uma conta com este e-mail.' });
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: await bcrypt.hash(data.password, 10),
        consentAt: new Date(),
      },
    });

    await startSession(reply, user);
    return reply.code(201).send({ user: publicUser(user) });
  });

  app.post('/login', { config: authRateLimit }, async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) {
      return reply.code(401).send({ message: 'E-mail ou senha inválidos.' });
    }

    await startSession(reply, user);
    return { user: publicUser(user) };
  });

  app.post('/logout', async (_request, reply) => {
    clearSession(reply);
    return reply.code(204).send();
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) {
      clearSession(reply);
      return reply.code(401).send({ message: 'Usuário não encontrado.' });
    }
    return { user: publicUser(user) };
  });
}
