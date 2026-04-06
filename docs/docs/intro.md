---
id: intro
title: Introdução
sidebar_position: 1
slug: /intro
---

# 🍳 CookSmart

**Sistema inteligente para precificação de produtos e gestão de custos para pequenos empreendedores.**

## Sobre o Projeto

CookSmart é uma aplicação que ajuda pequenos empreendedores a definir o preço de venda correto de seus produtos. Muitos empreendedores iniciantes têm dificuldade em calcular o preço adequado, seja por desconhecerem os custos envolvidos ou por falta de ferramentas acessíveis.

## ✨ Funcionalidades

- **Gestão de Ingredientes** – Registre ingredientes, insumos e matérias-primas com controle de preços unitários e histórico de compras.
- **Criação de Receitas** – Monte receitas ou produtos finais com cálculo automático dos custos diretos dos insumos utilizados.
- **Cálculo Automático** – Calcule automaticamente o custo total e obtenha sugestão de preço de venda baseado na margem de lucro configurada.
- **OCR de Notas Fiscais** – Integração com Amazon Textract para leitura automática de notas fiscais, facilitando o lançamento de insumos.
- **Relatórios** – Acompanhe a evolução de custos através de relatórios e históricos detalhados.
- **Despesas Operacionais** *(Roadmap)* – Planejado para integrar custos fixos e variáveis ao cálculo final.

## 🎯 Objetivos

- Ajudar pequenos empreendedores a definir preços justos e sustentáveis.
- Automatizar cálculos de custos diretos e indiretos, evitando erros comuns em planilhas manuais.
- Reduzir tempo e esforço na inserção de dados usando OCR para leitura de notas fiscais.
- Promover maior controle financeiro através de gestão integrada de despesas, insumos e receitas.
- Fornecer relatórios claros e intuitivos para apoiar decisões estratégicas.

## 🛠 Tecnologias

### Backend (`api/`)

| Tecnologia | Finalidade |
|---|---|
| **NestJS** | Framework Node.js server-side |
| **Prisma** | ORM para Node.js e TypeScript |
| **PostgreSQL** | Banco de dados relacional |
| **JWT** | Autenticação via JSON Web Tokens |
| **Swagger** | Documentação automática da API |

### Frontend (`ui/`)

| Tecnologia | Finalidade |
|---|---|
| **Next.js 14+** | Framework React com SSR |
| **TypeScript** | Tipagem estática |
| **Tailwind CSS** | Framework CSS utility-first |
| **Radix UI** | Componentes acessíveis |
| **React Hook Form** | Gerenciamento de formulários |
| **Sonner** | Notificações toast |

## 📦 Estrutura do Projeto

```
CookSmart/
├── api/           # Backend NestJS
├── ui/            # Frontend Next.js 14
├── docs/          # Documentação Docusaurus (este site)
└── documents/     # Diagramas e guias complementares
```

## 📝 Próximos Passos

- [x] Módulo OCR com Amazon Textract
- [x] Gestão de ingredientes, receitas e compras
- [ ] Despesas Operacionais completas
- [ ] Dashboard com gráficos e estatísticas
- [ ] Exportação de relatórios em PDF
- [ ] Aplicativo mobile
- [ ] Suporte multi-idioma
