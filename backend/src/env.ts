import 'dotenv/config';
import { z } from 'zod';

// Aceita a chave AES-256 em hexadecimal (64 caracteres) ou em base64 (formato gerado pelo Render)
function decodeKey(value: string): Buffer | null {
  if (/^[0-9a-fA-F]{64}$/.test(value)) return Buffer.from(value, 'hex');
  const key = Buffer.from(value, 'base64');
  return key.length === 32 ? key : null;
}

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  ENCRYPTION_KEY: z.string().transform((value, ctx) => {
    const key = decodeKey(value);
    if (!key) {
      ctx.addIssue({ code: 'custom', message: 'ENCRYPTION_KEY deve ser uma chave de 256 bits (64 caracteres hex ou base64)' });
      return z.NEVER;
    }
    return key;
  }),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  // E-mails (separados por vírgula) que podem ver os resultados agregados das avaliações
  ADMIN_EMAILS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
