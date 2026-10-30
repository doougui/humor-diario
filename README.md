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

### Segurança e LGPD

- Senhas armazenadas com **bcrypt**; sessão em **JWT dentro de cookie httpOnly** (não acessível por JavaScript, mitigando XSS).
- Anotações pessoais criptografadas com **AES-256-GCM** antes de irem para o banco.
- Todas as consultas filtram pelo `userId` do token: cada pessoa acessa apenas os próprios dados.
- Validação de todas as entradas com **Zod**; cabeçalhos de segurança com **helmet**; **rate limit** (10 tentativas/15 min em login e cadastro).
- Consentimento explícito registrado com data (`consent_at`), Política de Privacidade em linguagem simples e aviso sobre consentimento dos responsáveis para menores (art. 14).
- Hospedagem no Railway (servidores nos EUA): a transferência internacional é informada na Política de Privacidade e autorizada no consentimento do cadastro (art. 33, VIII).
- Direitos do titular (art. 18): acesso/portabilidade (exportar JSON), correção (editar perfil e registros) e eliminação (excluir conta).

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

## Publicação no Railway

O projeto já está preparado para o [Railway](https://railway.com): cada pasta tem um `railway.json` com os comandos de build, de migração do banco e de inicialização. O resultado será um projeto com três serviços:

```
Projeto no Railway
├── Postgres   → banco de dados
├── backend    → API (pasta backend/)
└── frontend   → aplicação web (pasta frontend/)   ← endereço que os usuários acessam
```

### Passo 1 — Enviar o código para o GitHub

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

### Passo 2 — Criar o projeto e o banco

1. Acesse https://railway.com, entre com sua conta do GitHub e assine o plano **Hobby** (US$ 5/mês, com US$ 5 de uso incluídos).
2. Clique em **New Project → Deploy PostgreSQL**. O serviço `Postgres` é criado.

### Passo 3 — Criar o serviço do backend

1. No projeto, clique em **+ Create → GitHub Repo** e escolha o repositório `humor-diario`.
2. Em **Settings** do novo serviço:
   - renomeie o serviço para **`backend`** (o nome é usado nas variáveis abaixo);
   - **Source → Root Directory:** `/backend`;
   - **Config-as-code → Railway Config File:** `/backend/railway.json`;
   - **Networking → Generate Domain** (gera o endereço público da API).

### Passo 4 — Criar o serviço do frontend

1. Novamente **+ Create → GitHub Repo**, escolhendo o mesmo repositório.
2. Em **Settings**:
   - renomeie o serviço para **`frontend`**;
   - **Root Directory:** `/frontend`;
   - **Railway Config File:** `/frontend/railway.json`;
   - **Networking → Generate Domain** — este será o endereço do aplicativo (ex.: `frontend-production-xxxx.up.railway.app`).

### Passo 5 — Configurar as variáveis de ambiente

Gere **duas chaves novas** (não reutilize as de desenvolvimento), executando o comando abaixo duas vezes:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Na aba **Variables** do serviço **backend**:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | primeira chave gerada |
| `ENCRYPTION_KEY` | segunda chave gerada |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}` |

Na aba **Variables** do serviço **frontend**:

| Variável | Valor |
| --- | --- |
| `BACKEND_URL` | `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}` |

Os valores entre `${{ }}` são referências que o próprio Railway preenche. Clique em **Deploy** para aplicar as alterações. No primeiro deploy do backend, o comando `npm run db:deploy` cria as tabelas automaticamente.

> ⚠️ **Guarde a `ENCRYPTION_KEY` em local seguro.** Se ela for perdida ou alterada, as anotações já gravadas não poderão mais ser lidas.

### Passo 6 — Testar

- Acesse `https://<domínio do backend>/health` → deve responder `{"status":"ok"}`.
- Acesse o domínio do **frontend**, crie uma conta e faça um registro.

A cada `git push` na branch `main`, o Railway publica a nova versão automaticamente.

### Dados de demonstração em produção (opcional)

Para popular o banco de produção com o usuário de demonstração (útil na apresentação), execute localmente, na pasta `backend`, apontando para o banco do Railway. Use o valor de `DATABASE_PUBLIC_URL` do serviço Postgres e a **mesma** `ENCRYPTION_KEY` de produção:

```bash
DATABASE_URL="<DATABASE_PUBLIC_URL do Railway>" ENCRYPTION_KEY="<chave de produção>" npm run db:seed
```

(No PowerShell, defina antes as variáveis com `$env:DATABASE_URL="..."` e `$env:ENCRYPTION_KEY="..."`.)

### Solução de problemas

| Sintoma | Causa provável |
| --- | --- |
| Backend não inicia: "Variáveis de ambiente inválidas" | Alguma variável do backend está faltando ou o domínio do frontend ainda não foi gerado |
| Login funciona, mas volta para a tela de login | `BACKEND_URL` incorreta no frontend — corrija e faça **redeploy** (o valor é lido durante o build) |
| Erro 502 nas chamadas `/api` | Backend fora do ar — veja os logs do serviço `backend` |

> O Humor Diário é uma ferramenta de autoconhecimento e **não substitui acompanhamento psicológico ou médico**. Precisa conversar? **CVV — 188** (gratuito, 24h).
