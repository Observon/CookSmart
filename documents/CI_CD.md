# CI/CD Pipeline - GitHub Actions

Este documento descreve o pipeline de CI/CD configurado no GitHub Actions para o projeto CookSmart.

## Visão Geral

O workflow `ci.yml` automatiza testes e builds para manter a qualidade do código em ambos os pacotes do monorepo (API e UI).

## Triggers

O pipeline é acionado automaticamente em:
- **Push** para `main` ou `develop`
- **Pull Request** para `main` ou `develop`

## Jobs

### 1. `install`
- **Objetivo**: Preparar cache de dependências
- **Ações**:
  - Configura Node.js 20
  - Instala pnpm 8
  - Download de cache do pnpm
  - Instala dependências com `pnpm install --frozen-lockfile`

### 2. `lint`
- **Dependência**: `install`
- **Objetivo**: Validar conformidade com padrões de código
- **Ações**:
  - `pnpm -C api run lint` — Verifica lint no backend (ESLint)
  - `pnpm -C ui run lint` — Verifica lint no frontend (Next.js + Tailwind utilities)

### 3. `test-api`
- **Dependência**: `install`
- **Objetivo**: Validar testes unitários e E2E do backend com banco de dados
- **Serviços**:
  - PostgreSQL 14 (para testes que exigem DB)
- **Ações**:
  - Gera Prisma Client (`prisma:generate`)
  - Executa testes unitários (`pnpm -C api run test`)
  - Executa testes E2E (`pnpm -C api run test:e2e`)
  - Build de produção (`pnpm -C api run build`)
- **Variáveis de ambiente**:
  - `DATABASE_URL` apontando para PostgreSQL em container
  - `NODE_ENV=production` para build

### 4. `test-ui`
- **Dependência**: `install`
- **Objetivo**: Validar testes e build do frontend
- **Ações**:
  - Executa testes unitários com Vitest (`pnpm -C ui run test`)
  - Build de produção Next.js (`pnpm -C ui run build`)

### 5. `all-checks`
- **Dependência**: `lint`, `test-api`, `test-ui`
- **Objetivo**: Garantir que todos os jobs passaram (status final)
- **Comportamento**: 
  - Falha se qualquer job upstream falhar
  - Permite que PR/push sejam bloqueados se CI não passar

## Cache Strategy

O pipeline utiliza cache do `pnpm` para otimizar tempo:
- **Key**: `${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}`
- **Restore-Keys**: Permite recuperar cache anterior caso `pnpm-lock.yaml` mude
- **Benefício**: Reduz tempo de instalação em CI de minutos para segundos

## Ambiente de Testes

### PostgreSQL (test-api)
- **Imagem**: `postgres:14-alpine`
- **Host**: `localhost:5432`
- **Database**: `cooksmart_test`
- **User**: `test`
- **Password**: `test`
- **Health Check**: Aguarda readiness com `pg_isready`

## Best Practices Aplicadas

1. ✅ **Frozen Lockfile**: `pnpm install --frozen-lockfile` garante versões exatas
2. ✅ **Isolated Jobs**: Cada job roda independentemente; falhas são isoladas
3. ✅ **Retry Logic**: PostgreSQL aguarda readiness (health check) antes de testes
4. ✅ **Cache Efficiency**: Restore-keys permite fallback em caso de lockfile mudanças
5. ✅ **Fail-fast**: `all-checks` job falha rápido se qualquer step importante falha
6. ✅ **Production Build**: API e UI são compilados em modo produção (`NODE_ENV=production`)

## Melhorias Futuras

- [ ] Code coverage reports (Codecov)
- [ ] Upload de artifacts (logs, coverage)
- [ ] Automatic deployment para staging (se usar CD)
- [ ] Notifications (Slack, Email) em falhas
- [ ] Performance benchmarks

## Troubleshooting

### "Lint failed"
- Rode `pnpm run lint` localmente em `api/` ou `ui/`
- Use `--fix` para auto-correção (ex.: `pnpm run lint --fix`)

### "Test failed"
- Rode testes locais: `pnpm -C api run test` ou `pnpm -C ui run test`
- Verifique variáveis de ambiente, especialmente `DATABASE_URL` para API

### "Build failed"
- Rode build local: `pnpm -C api run build` ou `pnpm -C ui run build`
- Verifique imports e sintaxe TypeScript

### Cache issues
- GitHub Actions limpa cache automaticamente após 7 dias sem acesso
- Para forçar nova instalação, delete cache manualmente em Settings → Actions → Caches

## Como Usar Localmente

Para reproduzir o CI pipeline localmente:

```bash
# Install
pnpm install

# Lint
pnpm run lint  # runs both api and ui linting

# Test API (requer PostgreSQL em 5432)
pnpm -C api run test
pnpm -C api run test:e2e

# Test UI
pnpm -C ui run test

# Build
pnpm -C api run build
pnpm -C ui run build
```

## Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pnpm CI Documentation](https://pnpm.io/ci)
- [Setup Node.js Action](https://github.com/actions/setup-node)
