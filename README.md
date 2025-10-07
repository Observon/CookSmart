# 🍳 CookSmart

Sistema inteligente para precificação de produtos e gestão de custos para pequenos empreendedores.

## 📋 Sobre o Projeto

CookSmart é uma aplicação que ajuda pequenos empreendedores a definir o preço de venda correto de seus produtos. Muitos empreendedores iniciantes têm dificuldade em calcular o preço adequado, seja por desconhecerem os custos envolvidos ou por falta de ferramentas acessíveis.

### ✨ Funcionalidades

- **Gestão de Ingredientes**: Registre ingredientes, insumos e matérias-primas com controle de preços unitários e histórico de compras
- **Criação de Receitas**: Monte receitas ou produtos finais com cálculo automático dos custos diretos dos insumos utilizados
- **Custos Operacionais**: Integre custos fixos e variáveis para uma visão realista do preço de produção
- **Cálculo Automático**: Calcule automaticamente o custo total e obtenha sugestão de preço de venda baseado na margem de lucro configurada
- **OCR de Notas Fiscais**: Integração com OCR para leitura automática de notas fiscais, facilitando o lançamento de insumos
- **Relatórios**: Acompanhe a evolução de custos através de relatórios e históricos detalhados

## 🎯 Objetivos

- Ajudar pequenos empreendedores a definir preços justos e sustentáveis
- Automatizar cálculos de custos diretos e indiretos, evitando erros comuns em planilhas manuais
- Reduzir tempo e esforço na inserção de dados usando OCR para leitura de notas fiscais
- Promover maior controle financeiro através de gestão integrada de despesas, insumos e receitas
- Fornecer relatórios claros e intuitivos para apoiar decisões estratégicas

## 🛠 Tecnologias

### Backend (`api/`)
- **NestJS** - Framework Node.js para construção de aplicações server-side
- **Prisma** - ORM moderno para Node.js e TypeScript
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação via JSON Web Tokens
- **Swagger** - Documentação automática da API

### Frontend (`ui/`)
- **Next.js 14+** - Framework React com Server-Side Rendering
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Componentes acessíveis e customizáveis
- **React Hook Form** - Gerenciamento de formulários
- **Sonner** - Notificações toast

## 📦 Estrutura do Projeto

```
CookSmart/
├── api/                    # Backend NestJS
│   ├── prisma/            # Schema e migrações do banco
│   ├── src/               # Código-fonte
│   │   ├── auth/          # Autenticação JWT
│   │   ├── ingredients/   # Gestão de ingredientes
│   │   ├── recipes/       # Gestão de receitas
│   │   ├── purchases/     # Gestão de compras
│   │   └── operational-expenses/  # Despesas operacionais
│   └── test/              # Testes E2E
├── ui/                    # Frontend Next.js
│   ├── app/               # Rotas e páginas (App Router)
│   ├── components/        # Componentes React
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Serviços e utilitários
│   └── context/           # Context providers
└── documents/             # Documentação adicional
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 20+
- **pnpm** 8+
- **PostgreSQL** 14+

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Observon/CookSmart.git
   cd CookSmart
   ```

2. **Instale as dependências** (raiz do monorepo)
   ```bash
   pnpm install
   ```

### Configuração do Backend

1. **Configure as variáveis de ambiente**
   ```bash
   cd api
   cp .env.example .env
   ```

2. **Edite o arquivo `.env`** com suas configurações:
   ```env
   DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
   JWT_SECRET=sua_chave_secreta_aqui
   FRONTEND_ORIGIN=http://localhost:3001
   PORT=3000
   ```

3. **Execute as migrações do Prisma**
   ```bash
   pnpm prisma:format
   pnpm prisma:migrate --name init
   pnpm prisma:generate
   ```

4. **Inicie o servidor**
   ```bash
   pnpm run start:dev
   ```

   O backend estará disponível em `http://localhost:3000`

### Configuração do Frontend

1. **Configure as variáveis de ambiente**
   ```bash
   cd ui
   cp .env.example .env.local  # ou crie o arquivo
   ```

2. **Edite o arquivo `.env.local`**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   pnpm run dev
   ```

   O frontend estará disponível em `http://localhost:3001`

## 📚 Documentação

- **[API Documentation](./api/README.md)** - Documentação detalhada do backend
- **[Setup Guide](./documents/setup.md)** - Guia completo de configuração de ambiente
- **[API Swagger](http://localhost:3000/docs)** - Documentação interativa da API (após iniciar o backend)

## 🧪 Testes

### Backend
```bash
cd api
pnpm run test          # Testes unitários
pnpm run test:e2e      # Testes end-to-end
pnpm run test:cov      # Cobertura de testes
```

### Frontend
```bash
cd ui
pnpm run lint          # Linting
```

## 🗄 Scripts Úteis

### Backend (Prisma)
```bash
pnpm prisma:format                    # Formatar schema
pnpm prisma:generate                  # Gerar client
pnpm prisma:migrate --name <titulo>   # Nova migração
pnpm prisma studio                    # Interface GUI do Prisma
```

### Backend (NestJS)
```bash
pnpm run build        # Build para produção
pnpm run start:prod   # Iniciar em modo produção
pnpm run lint         # Lint e fix
pnpm run format       # Formatar código
```

### Frontend (Next.js)
```bash
pnpm run build        # Build para produção
pnpm run start        # Iniciar em modo produção
pnpm run lint         # Linting
```

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação. Os usuários devem:

1. Registrar uma conta via endpoint `/auth/register`
2. Fazer login via `/auth/login` para obter o token
3. Incluir o token no header `Authorization: Bearer <token>` nas requisições protegidas

## 📊 Funcionalidades Principais

### Gestão de Ingredientes
- Cadastro de ingredientes com nome, unidade de medida e preço unitário
- Histórico de compras e variação de preços
- Atualização e exclusão de ingredientes

### Gestão de Receitas
- Criação de receitas com lista de ingredientes e quantidades
- Cálculo automático do custo total baseado nos ingredientes
- Definição de margem de lucro e sugestão de preço de venda
- Edição e exclusão de receitas

### Controle de Compras
- Registro de compras de insumos
- Atualização automática de preços dos ingredientes
- Histórico de transações

### Despesas Operacionais
- Cadastro de custos fixos e variáveis
- Integração no cálculo de preço final
- Relatórios de despesas

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Próximos Passos

- [ ] Implementação completa do módulo OCR para leitura de notas fiscais
- [ ] Dashboard com gráficos e estatísticas
- [ ] Exportação de relatórios em PDF
- [ ] Aplicativo mobile
- [ ] Integração com APIs de marketplaces
- [ ] Suporte multi-idioma
- [ ] Modo offline com sincronização

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 👤 Autor

**Erick Rangel**

## 🌟 Suporte

Se este projeto foi útil para você, considere dar uma ⭐️!

---

Desenvolvido com ❤️ para ajudar pequenos empreendedores a crescerem seus negócios.
