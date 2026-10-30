# Humor Diário

Aplicação web para **monitoramento diário de humor e promoção do bem-estar emocional**, desenvolvida como atividade extensionista do curso de Ciência da Computação. Público inicial: professores, funcionários e estudantes da **EBM Profª. Dalcy Ávila de Souza — Jaguaruna/SC**.

## Funcionalidades

| Módulo | O que faz |
| --- | --- |
| **Cadastro e login** | Conta com nome, e-mail, perfil (estudante, professor, funcionário, comunidade) e senha. Consentimento LGPD obrigatório. |
| **Registro diário** | Humor (1–5), energia (1–5), horas de sono, emoções, fatores que influenciaram o dia e anotação opcional. Um registro por dia, editável; permite registrar dias anteriores. |
| **Histórico** | Navegação mês a mês, com edição e exclusão de registros. |
| **Painel de análise** | Períodos de 7 dias, 30 dias, 3 meses e 1 ano: humor médio (com comparação ao período anterior), sequência de dias registrados, adesão, sono médio, gráfico de evolução de humor/energia, distribuição do humor, humor por dia da semana, impacto de cada fator, emoções mais frequentes, relação sono × humor e observações automáticas em linguagem simples. |
| **Conta (LGPD)** | Edição dos dados, exportação completa em JSON e exclusão definitiva da conta com todos os registros. |
| **Apoio** | Quando o humor registrado está baixo, a aplicação exibe orientações de apoio (CVV 188, SAMU 192). |
| **Avaliação** | Questionário de avaliação da aplicação: as 10 afirmações do **System Usability Scale (SUS)**, duas afirmações sobre a utilidade do painel e o autoconhecimento, e comentários abertos. O painel convida a responder quem já tem 3 ou mais registros. |
| **Resultados (administradores)** | Página `/resultados`, visível só para os e-mails em `ADMIN_EMAILS`: pontuação SUS média com nota (A–F), mediana, desvio padrão, distribuição, média por afirmação, resultados por perfil, distribuição das respostas e comentários anônimos, com exportação em CSV para o Excel. |

## Arquitetura

```
┌──────────────────────────┐      HTTP / JSON (API REST)      ┌──────────────────────────┐       ┌──────────────┐
│ Frontend                 │  ───────────────────────────────▶ │ Backend                  │ ────▶ │ PostgreSQL   │
│ Next.js 14 + TypeScript  │   cookie httpOnly com token JWT   │ Node.js + Fastify        │ Prisma│              │
│ Tailwind CSS + Recharts  │ ◀───────────────────────────────  │ Zod · JWT · bcrypt · AES │ ◀──── │              │
└──────────────────────────┘                                   └──────────────────────────┘       └──────────────┘
      localhost:3000                                                 localhost:3333                    :5432
```

```
humor-diario/
├── docker-compose.yml          # PostgreSQL em container (opcional)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos User e MoodEntry
│   │   └── seed.ts             # Usuário de demonstração com 90 dias de dados
│   └── src/
│       ├── server.ts / app.ts  # Inicialização do Fastify e plugins (CORS, helmet, JWT, rate limit)
│       ├── env.ts              # Validação das variáveis de ambiente
│       ├── constants.ts        # Emoções, fatores e perfis aceitos
│       ├── lib/                # Prisma, criptografia AES-256-GCM, utilitários de data
│       └── routes/             # auth, entries, analytics, account
└── frontend/
    └── src/
        ├── app/                # Páginas (App Router)
        │   ├── page.tsx        # Página inicial
        │   ├── login, cadastro, privacidade
        │   └── (app)/          # Área autenticada: registro, historico, painel, conta
        ├── components/         # Navbar, seletores de humor/energia, chips, alertas
        ├── contexts/auth.tsx   # Estado de autenticação
        └── lib/                # Cliente da API, tipos, constantes, datas
```

### Modelo de dados

- **User** — `id`, `name`, `email` (único), `password_hash`, `role`, `consent_at`, `created_at`, `updated_at`
- **MoodEntry** — `id`, `user_id` (FK, exclusão em cascata), `date`, `mood`, `energy`, `sleep_hours`, `emotions[]`, `factors[]`, `note` (criptografada), `created_at`, `updated_at` — restrição única em (`user_id`, `date`)

### Endpoints da API

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/register` | Cria conta (exige `consent: true`) e inicia sessão |
| POST | `/auth/login` | Autentica e inicia sessão |
| POST | `/auth/logout` | Encerra a sessão |
| GET | `/auth/me` | Dados do usuário autenticado |
| GET | `/entries?from=&to=` | Lista registros do usuário no período |
| PUT | `/entries/:date` | Cria ou atualiza o registro do dia (`AAAA-MM-DD`) |
| DELETE | `/entries/:date` | Exclui o registro do dia |
| GET | `/analytics/summary?days=30&today=` | Indicadores, séries para gráficos e observações |
| PUT | `/account` | Atualiza nome e perfil |
| GET | `/account/export` | Exporta todos os dados do usuário (JSON) |
| DELETE | `/account` | Exclui conta e registros (exige senha) |
| GET | `/feedback/me` | Avaliação enviada pelo próprio usuário |
| PUT | `/feedback` | Envia ou atualiza a avaliação (exige `researchConsent: true`) |
| GET | `/feedback/results` | Resultados agregados e anônimos (somente administradores) |
| GET | `/feedback/export.csv` | Respostas anônimas em CSV (somente administradores) |

### Avaliação da usabilidade (SUS)

A pontuação SUS segue Brooke (1996): nas afirmações ímpares (positivas) soma-se `resposta − 1`, nas pares (negativas) `5 − resposta`, e o total é multiplicado por 2,5, resultando em uma nota de 0 a 100. A classificação usa a escala de Sauro e Lewis (2016): **A** ≥ 80,3 · **B** ≥ 74 · **C** ≥ 68 (média de referência) · **D** ≥ 51 · **F** < 51.

As respostas guardam o perfil do participante e a quantidade de registros de humor no momento da resposta, permitindo cruzar usabilidade com engajamento. Para preservar o anonimato, estatísticas por perfil e o perfil dos comentários só são exibidos quando o grupo tem ao menos 3 respostas. Se o participante excluir a conta, a avaliação é desvinculada e mantida de forma anônima.

### Segurança e LGPD

- Senhas armazenadas com **bcrypt**; sessão em **JWT dentro de cookie httpOnly** (não acessível por JavaScript, mitigando XSS).
- Anotações pessoais criptografadas com **AES-256-GCM** antes de irem para o banco.
- Todas as consultas filtram pelo `userId` do token: cada pessoa acessa apenas os próprios dados.
- Validação de todas as entradas com **Zod**; cabeçalhos de segurança com **helmet**; **rate limit** (10 tentativas/15 min em login e cadastro).
- Consentimento explícito registrado com data (`consent_at`), Política de Privacidade em linguagem simples e aviso sobre consentimento dos responsáveis para menores (art. 14).
- Hospedagem no Render e na Vercel (servidores nos EUA): a transferência internacional é informada na Política de Privacidade e autorizada no consentimento do cadastro (art. 33, VIII). O banco só aceita conexões da rede interna do Render.
- Direitos do titular (art. 18): acesso/portabilidade (exportar JSON), correção (editar perfil e registros) e eliminação (excluir conta).
- Avaliações usadas no trabalho somente com autorização explícita e de forma anônima; administradores não têm acesso a nenhum registro de humor.

## Como executar

### 1. Pré-requisitos

- **Node.js 22 LTS** ou superior — https://nodejs.org
- **PostgreSQL 16 ou superior** — instalado localmente (https://www.postgresql.org/download/windows/) **ou** via Docker Desktop (`docker compose up -d`)

Ajuste usuário e senha do PostgreSQL em `DATABASE_URL` no arquivo `backend/.env`. O banco `humor_diario` é criado automaticamente pelo Prisma se ainda não existir.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # se ainda não existir; gere chaves próprias para JWT_SECRET e ENCRYPTION_KEY
npx prisma migrate dev      # cria as tabelas a partir das migrações em prisma/migrations
npm run db:seed             # opcional: cria o usuário demo@humordiario.test / demo1234 com 90 dias de dados
npm run dev                 # API em http://localhost:3333
```

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev                 # aplicação em http://localhost:3000
```

O frontend chama a API pelo caminho `/api/...`, que o próprio Next.js repassa ao backend definido em `BACKEND_URL` (arquivo `frontend/.env.local`). Assim o navegador só conversa com o domínio do frontend e o cookie de sessão funciona em todos os navegadores, inclusive no Safari (iPhone).

## Publicação: Render + Vercel

A aplicação é publicada em dois provedores:

```
Usuário ──▶ Vercel (frontend Next.js) ──/api──▶ Render (backend Fastify) ──▶ Render (PostgreSQL)
            humor-diario.vercel.app             humor-diario-backend.onrender.com   rede interna
```

- **Render**: o arquivo [`render.yaml`](render.yaml) (Blueprint) cria a API e o banco de uma só vez, gera as chaves secretas automaticamente e aplica as migrações a cada deploy.
- **Vercel**: publica o frontend. As chamadas `/api/...` são repassadas ao Render pelo próprio Next.js, então o navegador só conversa com o domínio da Vercel.

### Custos e limites dos planos gratuitos

| Item | Plano gratuito | Quando pagar |
| --- | --- | --- |
| API no Render | Hiberna após 15 min sem acesso; o primeiro acesso depois disso leva ~1 min | Plano **Starter** (~US$ 7/mês) não hiberna |
| Banco no Render | **Expira 30 dias após a criação** (os dados são apagados) | Para o uso real com participantes, mude para **Basic-256mb** (~US$ 6/mês) antes do vencimento |
| Frontend na Vercel | Gratuito (plano Hobby) | Não é necessário |

> Para testes e para a apresentação, o plano gratuito é suficiente. Para o período de uso na escola, com registros reais, **não use o banco gratuito**: os dados seriam perdidos após 30 dias.

### Passo 1: enviar o código para o GitHub

Crie um repositório **privado** no GitHub (ex.: `humor-diario`) e, dentro da pasta `humor-diario`:

```bash
git init
git add .
git commit -m "Versão inicial do Humor Diário"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/humor-diario.git
git push -u origin main
```

Os arquivos `.env` **não** são enviados (estão no `.gitignore`), pois contêm as chaves secretas.

### Passo 2: criar o backend e o banco no Render

1. Acesse https://render.com e entre com sua conta do GitHub.
2. Clique em **New → Blueprint** e selecione o repositório `humor-diario`.
3. O Render lê o `render.yaml` e mostra o que será criado: `humor-diario-backend` (web service) e `humor-diario-db` (PostgreSQL).
4. Ele pede dois valores:
   - `FRONTEND_URL`: se ainda não souber o endereço da Vercel, digite `https://humor-diario.vercel.app` por enquanto (dá para corrigir depois);
   - `ADMIN_EMAILS`: o(s) e-mail(s) de quem poderá ver os resultados das avaliações em `/resultados`, separados por vírgula. Use o mesmo e-mail com que você vai se cadastrar na aplicação.
5. Clique em **Deploy Blueprint**. O primeiro deploy cria as tabelas automaticamente.
6. Ao terminar, copie o endereço do backend (ex.: `https://humor-diario-backend.onrender.com`) e teste `https://<endereço>/health`. Deve responder `{"status":"ok"}`.

> ⚠️ **Faça uma cópia de segurança da `ENCRYPTION_KEY`.** Em *humor-diario-backend → Environment*, revele o valor gerado e guarde-o em local seguro (ex.: um gerenciador de senhas). Se ela for perdida, as anotações gravadas não poderão mais ser lidas.

### Passo 3: publicar o frontend na Vercel

1. Acesse https://vercel.com, entre com o GitHub e clique em **Add New → Project**.
2. Importe o repositório `humor-diario`.
3. Em **Root Directory**, clique em *Edit* e selecione `frontend`. O framework Next.js é detectado sozinho.
4. Em **Environment Variables**, adicione:

   | Nome | Valor |
   | --- | --- |
   | `BACKEND_URL` | o endereço do backend no Render, ex.: `https://humor-diario-backend.onrender.com` |

5. Clique em **Deploy**. Ao final, a Vercel mostra o endereço do aplicativo (ex.: `https://humor-diario.vercel.app`).

### Passo 4: ajustar o endereço do frontend no Render

Se o endereço da Vercel for diferente do que você digitou no Passo 2, atualize `FRONTEND_URL` em *humor-diario-backend → Environment* e salve (o Render reinicia o serviço sozinho).

Depois, acesse o endereço da Vercel, crie uma conta e faça um registro de teste.

A cada `git push` na branch `main`, Render e Vercel publicam a nova versão automaticamente.

### Dica: evitar a espera de ~1 minuto do plano gratuito

Cadastre o endereço `https://<backend>.onrender.com/health` em um serviço gratuito de monitoramento, como o [UptimeRobot](https://uptimerobot.com) ou o [cron-job.org](https://cron-job.org), para ser acessado a cada 10 minutos. Assim a API não hiberna. O plano gratuito do Render inclui 750 horas/mês, o suficiente para um serviço ligado o mês todo.

### Dados de demonstração em produção (opcional)

Por segurança, o banco não aceita conexões pela internet (`ipAllowList: []` no `render.yaml`). Para popular o banco com o usuário de demonstração na apresentação:

1. Em *humor-diario-db → Networking*, libere temporariamente o seu IP.
2. Na pasta `backend`, execute com a **External Database URL** do banco e a **mesma** `ENCRYPTION_KEY` de produção (no PowerShell):

   ```powershell
   $env:DATABASE_URL="<External Database URL>"; $env:ENCRYPTION_KEY="<chave de produção>"; npm run db:seed
   ```

3. Remova o seu IP da lista novamente.

### Solução de problemas

| Sintoma | Causa provável |
| --- | --- |
| Backend não inicia: "Variáveis de ambiente inválidas" | Alguma variável faltando em *humor-diario-backend → Environment* |
| Login funciona, mas volta para a tela de login | `BACKEND_URL` incorreta na Vercel. Corrija e faça **Redeploy** (o valor é lido durante o build) |
| Erro 502/504 no primeiro acesso | A API do Render estava hibernando. Aguarde ~1 minuto e tente de novo (ou use a dica acima) |
| O banco sumiu após um mês | O banco gratuito do Render expira em 30 dias. Use o plano Basic para dados reais |

> O Humor Diário é uma ferramenta de autoconhecimento e **não substitui acompanhamento psicológico ou médico**. Precisa conversar? **CVV — 188** (gratuito, 24h).
