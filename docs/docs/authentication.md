---
id: authentication
title: Autenticação
sidebar_position: 4
---

# 🔐 Autenticação

## Visão Geral

O sistema utiliza **JWT (JSON Web Tokens)** tanto no backend quanto no frontend.

## Fluxo

1. O usuário acessa a tela `LoginScreen` (`ui/components/login-screen.tsx`) e alterna entre cadastro e login.
2. A tela consome o hook `useAuth()` exposto pelo `AuthProvider` (`ui/context/auth-context.tsx`).
3. Após login bem-sucedido, o token e o usuário são salvos no `localStorage`.
4. O `AuthProvider` protege `ui/app/page.tsx` e expõe `logout()`.

## Requisições Autenticadas

Os hooks de dados (`useIngredients`, `useRecipes`) usam a função `apiFetch()` para enviar automaticamente:

```http
Authorization: Bearer <token>
```

## Endpoints REST

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cadastro de novo usuário |
| `POST` | `/auth/login` | Login e geração do JWT |

## Configuração

Certifique-se de definir no `api/.env`:

```env
JWT_SECRET=sua_chave_secreta_aqui
FRONTEND_ORIGIN=http://localhost:3001
```

O CORS aceita credenciais apenas para a origem configurada em `FRONTEND_ORIGIN`.

## Reset de Senha

O fluxo de redefinição de senha utiliza integração com **Supabase** e está implementado em `ui/app/reset-password/`.
