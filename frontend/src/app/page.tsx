'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth';
import { Logo } from '@/components/ui';

const FEATURES = [
  {
    icon: '✏️',
    title: 'Registro em menos de 1 minuto',
    text: 'Escolha como você está, o nível de energia, as emoções do dia e o que influenciou seu humor.',
  },
  {
    icon: '📊',
    title: 'Gráficos e padrões',
    text: 'Acompanhe a evolução do seu humor por semana, mês ou ano e descubra o que faz bem para você.',
  },
  {
    icon: '🔒',
    title: 'Privado e seguro',
    text: 'Seus registros são só seus. Anotações são criptografadas e você pode exportar ou excluir seus dados a qualquer momento.',
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/registro" className="btn-primary">
              Abrir meu diário
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-primary hidden sm:inline-flex">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-12 text-center sm:py-20">
          <p className="mb-4 text-5xl" aria-hidden>
            😄 🙂 😐 🙁 😢
          </p>
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Como você está se sentindo hoje?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            O <strong>Humor Diário</strong> ajuda você a registrar suas emoções todos os dias e a perceber padrões que
            influenciam seu bem-estar. Gratuito, simples e funciona em qualquer navegador.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={user ? '/registro' : '/cadastro'} className="btn-primary px-6 py-3 text-base">
              {user ? 'Registrar meu humor' : 'Começar agora'}
            </Link>
            {!user && (
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                Já tenho conta
              </Link>
            )}
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="card">
              <p className="text-3xl" aria-hidden>
                {feature.icon}
              </p>
              <h2 className="mt-3 font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{feature.text}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        <p>Projeto de extensão — EBM Profª. Dalcy Ávila de Souza · Jaguaruna/SC</p>
        <p className="mt-1">
          <Link href="/privacidade" className="underline hover:text-slate-700">
            Política de Privacidade
          </Link>{' '}
          · Precisa conversar? CVV: ligue 188 (24h, gratuito)
        </p>
      </footer>
    </div>
  );
}
