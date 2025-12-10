# Biomo Review

Sistema de feedback visual para alteracoes de sites. Permite que clientes e equipes colaborem de forma eficiente na revisao de alteracoes em projetos web.

![Version](https://img.shields.io/badge/version-1.0.0-green?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-11.0-FFCA28?style=flat-square&logo=firebase)
![Tests](https://img.shields.io/badge/tests-50%20passed-success?style=flat-square)

## Funcionalidades

### Gerenciamento de Projetos
- Criar, editar e excluir projetos
- Visualizador de sites via iframe
- Link publico para compartilhar com clientes
- Dashboard com estatisticas

### Sistema de Feedback
- **Marcacao visual**: Clique em qualquer ponto do site para criar feedback
- **Screenshot automatico**: Captura automatica da area clicada
- **Gravacao de audio**: Grave explicacoes em audio
- **Upload de arquivos**: Ate 30MB por arquivo, multiplos anexos
- **Comparacao antes/depois**: Visualize as mudancas lado a lado

### Workflow de Status
6 status para controle completo do fluxo:

| Status | Descricao |
|--------|-----------|
| `new` | Novo feedback criado |
| `in_review` | Em analise pela equipe |
| `in_progress` | Em desenvolvimento |
| `waiting_client` | Aguardando resposta do cliente |
| `rejected` | Feedback rejeitado |
| `completed` | Alteracao concluida |

### Historico de Status
- Rastreamento completo de todas as mudancas de status
- Registro de quem alterou (admin/cliente)
- Timestamp de cada alteracao
- Notas opcionais em cada transicao

### Sistema de Comentarios
- Threads de comentarios por feedback
- Gravacao de audio nos comentarios
- Mencoes e notificacoes

### v1.0.0 - Premium Features

#### UX Aprimorada
- **Toast Notifications**: Sistema de notificacoes elegante (substitui alerts)
- **Skeleton Loading**: Loading states animados em todas as paginas
- **Command Palette**: Acesso rapido via `Ctrl/Cmd + K`
- **Floating Action Button**: Acoes rapidas sempre visiveis
- **Onboarding Tour**: Tour guiado para novos usuarios
- **Feedback Templates**: Templates prontos (Bug, Texto, Layout, Feature)

#### Visualizacoes
- **Kanban Board**: Visualizacao em quadro dos feedbacks
- **Analytics Dashboard**: Graficos e metricas detalhadas

#### Integracoes
- **Sentry**: Rastreamento de erros em producao
- **Slack Webhooks**: Notificacoes no Slack
- **Custom Webhooks**: Integre com qualquer sistema

#### Acessibilidade (WCAG 2.1)
- Skip navigation link
- ARIA labels e roles
- Navegacao por teclado
- Suporte a reduced motion

#### PWA
- Indicador de modo offline
- Prompt de atualizacao
- Instalavel como app

## Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilizacao**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Banco de Dados**: Firebase Firestore
- **Storage**: Firebase Storage
- **Autenticacao**: NextAuth.js
- **Graficos**: Recharts
- **Monitoramento**: Sentry
- **Testes**: Playwright (50 testes E2E)

## Instalacao

### Pre-requisitos
- Node.js 18+
- npm ou yarn
- Conta Firebase (opcional para modo demo)

### Setup

1. Clone o repositorio:
```bash
git clone https://github.com/agencia-biomo/biomo-review.git
cd biomo-review
```

2. Instale as dependencias:
```bash
npm install
```

3. Configure as variaveis de ambiente:
```bash
cp .env.example .env.local
```

4. Edite o `.env.local` com suas credenciais Firebase (opcional):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

FIREBASE_ADMIN_PROJECT_ID=seu_projeto
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@seu_projeto.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

NEXTAUTH_SECRET=sua_chave_secreta
NEXTAUTH_URL=http://localhost:3000
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse http://localhost:3000

## Modo Demo

O sistema funciona sem Firebase configurado usando um banco de dados em memoria (mock). Ideal para testes e desenvolvimento.

### Credenciais de Demo:
| Usuario | Email | Senha |
|---------|-------|-------|
| Admin | admin@biomo.com.br | admin123 |
| Equipe | equipe@biomo.com.br | equipe123 |

## Scripts Disponiveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run dev:emulator     # Inicia com Firebase Emulator

# Build
npm run build            # Build de producao
npm run start            # Inicia servidor de producao

# Testes
npm run test:e2e         # Testes E2E com Playwright (local)
TEST_PROD=true npx playwright test  # Testes em producao
npx playwright test --project=chromium  # Apenas desktop
npx playwright test --project=mobile    # Apenas mobile
npx playwright show-report              # Ver relatorio HTML

# Utilitarios
node scripts/cleanup-test-data.js       # Limpa dados de teste (local)
TEST_PROD=true node scripts/cleanup-test-data.js  # Limpa em producao

# Linting
npm run lint             # Executa ESLint
```

## Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── api/               # API Routes
│   │   ├── feedbacks/     # CRUD de feedbacks
│   │   ├── projects/      # CRUD de projetos
│   │   ├── comments/      # Sistema de comentarios
│   │   └── upload/        # Upload de arquivos
│   ├── login/             # Pagina de login
│   ├── projetos/[id]/     # Visualizador de projeto (admin)
│   └── p/[token]/         # Visualizador publico (cliente)
├── components/
│   ├── feedback/          # Componentes de feedback
│   │   ├── FeedbackModal.tsx
│   │   ├── FeedbackDetailModal.tsx
│   │   ├── FeedbackTimeline.tsx
│   │   ├── StatusHistoryTimeline.tsx
│   │   ├── CommentThread.tsx
│   │   └── BeforeAfterComparison.tsx
│   ├── project/           # Componentes de projeto
│   └── ui/                # Componentes UI (shadcn)
├── lib/                   # Utilitarios
│   ├── firebase.ts        # Config Firebase Client
│   ├── firebase-admin.ts  # Config Firebase Admin
│   ├── mock-db.ts         # Mock database
│   └── auth.ts            # Config NextAuth
└── types/                 # TypeScript types
    └── index.ts
```

## API Reference

### Projetos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/projects` | Lista todos os projetos |
| POST | `/api/projects` | Cria novo projeto |
| GET | `/api/projects/[id]` | Busca projeto por ID |
| PATCH | `/api/projects/[id]` | Atualiza projeto |
| DELETE | `/api/projects/[id]` | Remove projeto |

### Feedbacks

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/feedbacks?projectId=xxx` | Lista feedbacks do projeto |
| POST | `/api/feedbacks` | Cria novo feedback |
| GET | `/api/feedbacks/[id]` | Busca feedback por ID |
| PATCH | `/api/feedbacks/[id]` | Atualiza feedback/status |
| DELETE | `/api/feedbacks/[id]` | Remove feedback |

## Deploy

### Vercel (Recomendado)

1. Conecte seu repositorio ao Vercel
2. Configure as variaveis de ambiente
3. Deploy automatico a cada push

### Firebase Hosting

```bash
npm run build
firebase deploy
```

## Contribuicao

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudancas (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Conventional Commits

Este projeto segue o padrao [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correcao de bug
- `docs:` Documentacao
- `style:` Formatacao
- `refactor:` Refatoracao
- `test:` Testes
- `chore:` Tarefas de manutencao

## Licenca

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

**Agencia Biomo**
- Website: [biomo.com.br](https://biomo.com.br)
- Email: contato@biomo.com.br

---

Desenvolvido com muito cafe por [Agencia Biomo](https://biomo.com.br)
