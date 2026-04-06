---
id: ci-cd
title: CI/CD Pipeline
sidebar_position: 6
---

# 🔄 CI/CD Pipeline

## Visão Geral

O workflow `ci.yml` automatiza testes e builds para manter a qualidade do código em ambos os pacotes do monorepo (API e UI).

## Triggers

O pipeline é acionado em:

- **Push** para `main` ou `develop`
- **Pull Request** para `main` ou `develop`

## Jobs

### 1. `install`

Prepara o cache de dependências:

- Configura Node.js 20
- Instala pnpm 10
- Faz download do cache do pnpm
- Executa `pnpm install --frozen-lockfile`

### 2. `lint`

Valida conformidade com padrões de código:

```bash
pnpm -C api run lint   # ESLint no backend
pnpm -C ui run lint    # Next.js + Tailwind no frontend
```

### 3. `test-api`

> **Status atual**: temporariamente desativado (`if: false`) enquanto o ambiente da API está offline.

Quando ativo:

- Gera Prisma Client (`prisma:generate`)
- Executa testes unitários e E2E
- Build de produção (`NODE_ENV=production`)
- Requer PostgreSQL 14 em container

### 4. `test-ui`

Valida testes e build do frontend:

```bash
pnpm -C ui run test    # Vitest
pnpm -C ui run build   # Next.js build
```

### 5. `all-checks`

Job de status final – falha se qualquer job upstream falhar.

## Cache Strategy

```
Key:          ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
Restore-Keys: Permite recuperar cache anterior
```

## Reproduzir Localmente

```bash
# Instalar dependências
pnpm install

# Lint
pnpm run lint

# Testes (requer PostgreSQL para API)
pnpm -C api run test
pnpm -C ui run test

# Build
pnpm -C api run build
pnpm -C ui run build
```

## Boas Práticas

1. **Frozen Lockfile** – `pnpm install --frozen-lockfile` garante versões exatas.
2. **Isolated Jobs** – Cada job roda independentemente.
3. **Retry Logic** – PostgreSQL aguarda readiness (health check) antes dos testes.
4. **Cache Efficiency** – Restore-keys permitem fallback em caso de mudanças no lockfile.
5. **Fail-fast** – `all-checks` falha rapidamente se qualquer step importante falha.
6. **Production Build** – API e UI são compilados em modo produção.

## Melhorias Futuras

- [ ] Code coverage reports (Codecov)
- [ ] Upload de artifacts (logs, coverage)
- [ ] Deployment automático para staging
- [ ] Notificações (Slack, e-mail) em falhas
- [ ] Performance benchmarks
