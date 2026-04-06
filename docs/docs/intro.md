---
sidebar_position: 1
---

# Introdução ao CookSmart

**CookSmart** é um sistema inteligente para precificação de produtos e gestão de custos voltado para pequenos empreendedores.

## O que é o CookSmart?

Muitos empreendedores iniciantes têm dificuldade em calcular o preço correto dos seus produtos, seja por não conhecerem os custos envolvidos ou por falta de ferramentas acessíveis. O CookSmart resolve esse problema oferecendo uma solução prática que:

- **Registra ingredientes** e insumos com controle de preços unitários e histórico de compras
- **Cria receitas** com cálculo automático dos custos diretos dos insumos utilizados
- **Calcula automaticamente** o custo total e sugere o preço de venda baseado na margem de lucro configurada
- **Integra OCR** para leitura automática de notas fiscais via Amazon Textract
- **Gera relatórios** e histórico para acompanhar a evolução de custos

## Arquitetura

O projeto é um monorepo com duas aplicações principais:

| Pacote | Tecnologia | Descrição |
|--------|-----------|-----------|
| `api/` | NestJS + Prisma + PostgreSQL | Backend REST com autenticação JWT |
| `ui/` | Next.js 14 + TypeScript + Tailwind CSS | Frontend com App Router |
| `docs/` | Docusaurus | Esta documentação |

## Próximos Passos

- [Instalação e Configuração](./getting-started/installation) — Configure o ambiente de desenvolvimento
- [Backend (API)](./backend/overview) — Documentação detalhada da API NestJS
- [Frontend (UI)](./frontend/overview) — Documentação do frontend Next.js
- [Funcionalidades](./features/ingredients) — Guia das funcionalidades disponíveis

## Objetivos do Projeto

- Ajudar pequenos empreendedores a definir preços justos e sustentáveis
- Automatizar cálculos de custos diretos e indiretos
- Reduzir tempo e esforço na inserção de dados usando OCR
- Promover maior controle financeiro integrado
- Fornecer relatórios claros para apoiar decisões estratégicas
