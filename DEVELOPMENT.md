# Biomo Review - Guia de Desenvolvimento

## Scripts Disponíveis

### Desenvolvimento

```bash
# Desenvolvimento normal (usa mock database)
npm run dev

# Desenvolvimento com Firebase Emulators
npm run dev:emulator
```

### Firebase Emulators

```bash
# Iniciar apenas os emuladores
npm run emulators

# Iniciar emuladores com dados salvos
npm run emulators:import

# Salvar dados dos emuladores
npm run emulators:export
```

### Testes

```bash
# Rodar todos os testes
npm test

# Rodar apenas testes E2E
npm run test:e2e

# Rodar testes visuais
npm run test:visual

# Atualizar snapshots visuais
npm run test:visual:update

# Rodar testes com UI interativa
npm run test:ui

# Ver relatório de testes
npm run test:report
```

### Build

```bash
# Build de produção
npm run build

# Iniciar servidor de produção
npm run start
```

## Modos de Execução

### 1. Modo Demo (Padrão)

Sem configurar Firebase, a aplicação roda com um banco de dados em memória.
- Dados são perdidos ao reiniciar
- Ideal para desenvolvimento rápido e testes

### 2. Modo Emulador

Para usar Firebase Emulators:

1. Copie o arquivo de ambiente:
   ```bash
   cp .env.emulator .env.local
   ```

2. Inicie com emuladores:
   ```bash
   npm run dev:emulator
   ```

3. Acesse a UI dos emuladores: http://localhost:4000

### 3. Modo Produção

Para usar Firebase real:

1. Obtenha a chave privada do Firebase Console:
   - Acesse https://console.firebase.google.com/project/barbearia-biomo/settings/serviceaccounts/adminsdk
   - Clique em "Gerar nova chave privada"
   - Copie o valor de `private_key`

2. Configure no `.env.local`:
   ```
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

## Estrutura de Testes

```
tests/
├── e2e/
│   ├── api.spec.ts       # Testes de API
│   └── projects.spec.ts  # Testes de UI
└── visual/
    └── visual.spec.ts    # Testes de screenshot
```

## Portas Utilizadas

| Serviço | Porta |
|---------|-------|
| Next.js | 3000 |
| Firebase Auth Emulator | 9099 |
| Firestore Emulator | 8080 |
| Functions Emulator | 5001 |
| Hosting Emulator | 5000 |
| Storage Emulator | 9199 |
| Emulator UI | 4000 |

## Solução de Problemas

### Erro: Firebase Admin não inicializado

Verifique se:
1. As variáveis de ambiente estão configuradas corretamente
2. A chave privada está no formato correto (com `\n` escapados)

### Testes falhando por timeout

Aumente o timeout no `playwright.config.ts` ou aguarde a página carregar:
```typescript
await page.waitForLoadState('networkidle');
```

### Emuladores não iniciam

Verifique se:
1. Java está instalado (necessário para Firestore)
2. As portas não estão em uso
