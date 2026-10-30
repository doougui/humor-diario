// Cria um usuário de demonstração com 90 dias de registros fictícios, útil para apresentar o painel de análise.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encrypt } from '../src/lib/crypto';
import { addDays, todayUTC } from '../src/lib/dates';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@humordiario.test';
const DEMO_PASSWORD = 'demo1234';

const positiveEmotions = ['feliz', 'calmo', 'grato', 'motivado', 'confiante'];
const negativeEmotions = ['ansioso', 'triste', 'irritado', 'cansado', 'estressado', 'sozinho', 'entediado'];
const notes = [
  'Dia tranquilo na escola.',
  'Prova de matemática me deixou nervoso.',
  'Joguei futebol com os amigos depois da aula.',
  'Dormi mal e fiquei cansado o dia todo.',
  'Almoço em família no fim de semana.',
  null,
  null,
];

function pick<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

function clamp(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: 'Usuário Demonstração',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      role: 'ESTUDANTE',
      consentAt: new Date(),
    },
  });

  const today = todayUTC();
  const entries = [];

  for (let i = 89; i >= 0; i--) {
    if (Math.random() < 0.15) continue; // simula dias sem registro

    const date = addDays(today, -i);
    const weekday = date.getUTCDay();
    const sleepHours = Math.round((5 + Math.random() * 4.5) * 2) / 2;
    const exercised = Math.random() < 0.35;
    const friends = Math.random() < 0.4;
    const school = weekday >= 1 && weekday <= 5 && Math.random() < 0.6;

    // Padrões fictícios: exercício, amigos e sono adequado melhoram o humor; segundas-feiras são mais difíceis
    let mood = 3 + (Math.random() - 0.5) * 1.5;
    if (exercised) mood += 0.8;
    if (friends) mood += 0.5;
    if (sleepHours < 6) mood -= 1;
    if (weekday === 1) mood -= 0.6;
    if (weekday === 6 || weekday === 0) mood += 0.4;
    if (school && Math.random() < 0.4) mood -= 0.5;
    const finalMood = clamp(mood);

    const factors = ['sono'];
    if (exercised) factors.push('exercicio');
    if (friends) factors.push('amigos');
    if (school) factors.push('escola');
    if (Math.random() < 0.3) factors.push('familia');
    if (Math.random() < 0.2) factors.push('redes_sociais');

    const emotions = finalMood >= 4 ? pick(positiveEmotions, 2) : finalMood <= 2 ? pick(negativeEmotions, 2) : [...pick(positiveEmotions, 1), ...pick(negativeEmotions, 1)];
    const note = notes[Math.floor(Math.random() * notes.length)];

    entries.push({
      userId: user.id,
      date,
      mood: finalMood,
      energy: clamp(finalMood + (sleepHours >= 7 ? 0.5 : -0.5) + (Math.random() - 0.5)),
      sleepHours,
      emotions,
      factors,
      note: note ? encrypt(note) : null,
    });
  }

  await prisma.moodEntry.createMany({ data: entries });
  console.log(`Usuário de demonstração criado: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${entries.length} registros)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
