---
sidebar_position: 1
---

# CI/CD Pipeline

O projeto utiliza **GitHub Actions** para automatizar testes e builds do monorepo.

## Triggers

O pipeline é acionado em:

- **Push** para `main` ou `develop`
- **Pull Request** para `main` ou `develop`

## Jobs

### `install`

Prepara o cache de dependências com `pnpm install --frozen-lockfile`.

### `lint`

Executa o linting em ambos os pacotes:

```bash
pnpm -C api run lint   # ESLint no backend
pnpm -C ui run lint    # Next.js + Tailwind no frontend
```

### `test-api`

_Temporariamente desativado_ (`if: false`). Quando ativo, executa testes unitários e E2E do backend com PostgreSQL em container.

### `test-ui`

Executa testes do frontend e build de produção:

```bash
pnpm -C ui run test    # Testes Vitest
pnpm -C ui run build   # Build Next.js
```

### `docs`

Constrói a documentação Docusaurus e faz deploy para GitHub Pages no push para `main`.

```bash
pnpm -C docs run build
```

### `all-checks`

Job composto que garante que todos os jobs upstream passaram.

## Cache Strategy

O pipeline usa cache do pnpm via:

```
key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

## Como Reproduzir Localmente

```bash
# Instalar dependências
pnpm install

# Lint
pnpm -C api run lint
pnpm -C ui run lint

# Testes do frontend
pnpm -C ui run test

# Build docs
pnpm -C docs run build

# Build de produção
pnpm -C api run build
pnpm -C ui run build
```

## Melhorias Futuras

- [ ] Code coverage reports (Codecov)
- [ ] Upload de artifacts (logs, coverage)
- [ ] Deploy automático para staging (CD)
- [ ] Notificações (Slack, Email) em falhas
- [ ] Performance benchmarks
- [ ] Reativar `test-api` com banco de dados em container
