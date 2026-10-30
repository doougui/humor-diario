import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ROLES } from '../constants';
import { clearSession, publicUser } from './auth';
import { serializeEntry } from './entries';

const updateSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(80),
  role: z.enum(ROLES),
});

const deleteSchema = z.object({
  password: z.string().min(1, 'Informe sua senha para confirmar.'),
});

// Rotas que atendem aos direitos do titular previstos no art. 18 da LGPD
export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Correção de dados (art. 18, III)
  app.put('/', async (request) => {
    const data = updateSchema.parse(request.body);
    const user = await prisma.user.update({ where: { id: request.user.sub }, data });
    return { user: publicUser(user) };
  });

  // Acesso e portabilidade dos dados (art. 18, II e V)
  app.get('/export', async (request, reply) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.sub },
      include: { entries: { orderBy: { date: 'asc' } }, feedback: true },
    });

    reply.header('Content-Disposition', 'attachment; filename="meus-dados-humor-diario.json"');
    return {
      exportedAt: new Date().toISOString(),
      user: publicUser(user),
      entries: user.entries.map(serializeEntry),
      feedback: user.feedback,
    };
  });

  // Eliminação dos dados e revogação do consentimento (art. 18, VI e IX)
  app.delete('/', async (request, reply) => {
    const { password } = deleteSchema.parse(request.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.user.sub } });

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ message: 'Senha incorreta.' });
    }

    // Os registros de humor são removidos em cascata (onDelete: Cascade)
    await prisma.user.delete({ where: { id: user.id } });
    clearSession(reply);
    return reply.code(204).send();
  });
}
