import Link from 'next/link';
import { Logo } from '@/components/ui';

export const metadata = { title: 'Política de Privacidade · Humor Diário' };

const SECTIONS = [
  {
    title: '1. Quais dados coletamos',
    items: [
      'Dados de cadastro: nome, e-mail, perfil (estudante, professor, funcionário ou comunidade) e senha — armazenada apenas na forma de hash (bcrypt), nunca em texto puro.',
      'Registros diários: humor, nível de energia, horas de sono, emoções, fatores que influenciaram o dia e anotações opcionais.',
      'Data e hora em que você aceitou esta política.',
      'Avaliação da aplicação (opcional): respostas ao questionário de usabilidade, comentários, seu perfil e a quantidade de registros feitos até o momento da resposta.',
    ],
  },
  {
    title: '2. Para que usamos seus dados',
    items: [
      'Exibir seu histórico de registros e gerar gráficos, indicadores e observações sobre seus padrões emocionais.',
      'Autenticar seu acesso à plataforma.',
      'Os dados não são vendidos, compartilhados com terceiros nem utilizados para publicidade.',
      'Nenhum professor, funcionário ou administrador da escola tem acesso aos seus registros individuais.',
      'As avaliações da aplicação são usadas, mediante sua autorização, de forma anônima no trabalho acadêmico do projeto. Os responsáveis veem somente resultados agregados e comentários sem nome ou e-mail; estatísticas por perfil só são exibidas quando o grupo tem ao menos 3 respostas.',
    ],
  },
  {
    title: '3. Base legal',
    items: [
      'Informações sobre o estado emocional são consideradas dados pessoais sensíveis relacionados à saúde (LGPD, art. 5º, II). O tratamento é realizado com base no seu consentimento específico e destacado (art. 7º, I e art. 11, I).',
      'Para crianças e adolescentes, o tratamento depende do consentimento de pelo menos um dos pais ou responsável legal e é realizado no seu melhor interesse (art. 14).',
    ],
  },
  {
    title: '4. Como protegemos seus dados',
    items: [
      'Acesso protegido por login e sessão em cookie seguro (httpOnly), inacessível a scripts do navegador.',
      'Anotações pessoais armazenadas com criptografia AES-256-GCM.',
      'Cada pessoa só consegue consultar os próprios registros.',
      'Limitação de tentativas de login para dificultar ataques de força bruta.',
      'Conexão sempre criptografada (HTTPS).',
    ],
  },
  {
    title: '5. Onde seus dados ficam armazenados',
    items: [
      'A API e o banco de dados são hospedados no provedor Render (Render Services, Inc.), em servidores localizados nos Estados Unidos. O site é entregue pela Vercel (Vercel Inc.), que apenas repassa as requisições à API, sem armazenar seus registros.',
      'Essa transferência internacional é realizada com base no seu consentimento específico e em destaque, informado no momento do cadastro (LGPD, art. 33, VIII). Os provedores atuam apenas como operadores, sem utilizar os dados para outras finalidades.',
      'O banco de dados não é acessível pela internet: apenas a API da aplicação consegue se conectar a ele.',
    ],
  },
  {
    title: '6. Seus direitos (LGPD, art. 18)',
    items: [
      'Acessar e baixar todos os seus dados em formato JSON (portabilidade) — na página "Conta".',
      'Corrigir seus dados de cadastro e editar ou excluir qualquer registro diário.',
      'Revogar o consentimento e excluir sua conta definitivamente, junto com todos os registros — na página "Conta". Caso você tenha respondido a avaliação, ela é desvinculada da conta e mantida apenas de forma anônima, para uso no trabalho acadêmico (art. 16, IV).',
    ],
  },
  {
    title: '7. Importante',
    items: [
      'O Humor Diário é uma ferramenta de autoconhecimento e não substitui acompanhamento psicológico ou médico.',
      'Se estiver passando por um momento difícil, procure ajuda: CVV — ligue 188 (gratuito, 24h) ou acesse cvv.org.br. Em emergências, ligue 192 (SAMU).',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Logo />
        <Link href="/cadastro" className="btn-secondary">
          Voltar ao cadastro
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <div className="card space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Política de Privacidade</h1>
            <p className="mt-2 text-slate-600">
              Esta política explica como o Humor Diário trata seus dados pessoais, em conformidade com a Lei Geral de
              Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
            </p>
          </div>
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-700">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
