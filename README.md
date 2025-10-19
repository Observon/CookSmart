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
   pnpm prisma migrate dev
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
pnpm run test          # Testes unitários com Vitest
pnpm run test:watch    # Modo watch para desenvolvimento
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

O sistema utiliza JWT (JSON Web Tokens) e contempla tanto o backend quanto o fluxo do frontend:

- **Registro/Login via UI**: a tela `LoginScreen` (`ui/components/login-screen.tsx`) permite alternar entre cadastro e login. Ela consome o hook `useAuth()` exposto por `AuthProvider` (`ui/context/auth-context.tsx`).
- **Persistência de sessão**: o `AuthProvider` salva token e usuário no `localStorage`, protege `ui/app/page.tsx` e expõe `logout()`.
- **Requisições autenticadas**: os hooks de dados (`useIngredients`, `useRecipes`) usam `apiFetch()` para enviar `Authorization: Bearer <token>` automaticamente.
- **Endpoints REST**: é possível interagir diretamente com `/auth/register` e `/auth/login` (para automações ou testes via HTTP clients).

Certifique-se de definir `JWT_SECRET` e `FRONTEND_ORIGIN` no backend para que CORS aceite chamadas do frontend.

## 🔄 Hooks de Dados

Os principais fluxos do frontend utilizam hooks que encapsulam comunicação com a API:

- **`useIngredients()`** (`ui/hooks/use-ingredients.ts`):
  - Lista ingredientes (`GET /ingredients`).
  - Cria/atualiza/remove ingredientes (`POST`, `PATCH`, `DELETE /ingredients`).
  - Expõe estados `loading`, `saving`, `error` e ações (`refresh`, `createIngredient`, `updateIngredient`, `deleteIngredient`).
- **`useRecipes()`** (`ui/hooks/use-recipes.ts`):
  - Integra com `/recipes` para CRUD de receitas.
  - Retorna estados/ações equivalentes aos de ingredientes.

Ambos dependem de `useAuth()` para obter o token JWT. Ao integrar novas telas, priorize reutilizar esses hooks.

## 🌐 Execução Local & CORS

- O backend NestJS escuta em `http://localhost:3000` (variável `PORT`) e habilita CORS via `app.enableCors({ origin: FRONTEND_ORIGIN, credentials: true })` em `api/src/main.ts`.
- Configure `FRONTEND_ORIGIN=http://localhost:3001` no backend para permitir chamadas do Next.js.
- O frontend roda em `http://localhost:3001` (`pnpm run dev -p 3001`) para evitar conflito de porta com o backend. Garanta que `NEXT_PUBLIC_API_URL` aponte para `http://localhost:3000`.

## 📊 Funcionalidades Principais

### Gestão de Ingredientes
- Cadastro de ingredientes com nome, unidade de medida e preço unitário
- Histórico de compras e variação de preços
- Atualização e exclusão de ingredientes

### Gestão de Receitas
- Criação de receitas com lista de ingredientes e quantidades
- Cálculo automático do custo total baseado nos ingredientes
- Definição de margem de lucro (%) por receita e sugestão de preço de venda baseada nesse valor
- Edição e exclusão de receitas

## 💰 Margem de Lucro Personalizada

- **Cadastro/Edição**: ao criar ou editar uma receita na UI (`RecipeFormScreen`), informe a margem de lucro desejada em porcentagem. O frontend envia `profitMargin` para a API.
- **Cálculo no backend**: o serviço de receitas (`api/src/recipes/recipes.service.ts`) calcula `suggestedPrice` usando `costPerServing * (1 + profitMargin/100)` e salva ambos os valores.
- **Exibição**: telas de listagem e detalhes (`RecipeListScreen`, `RecipeDetailScreen`) mostram o preço sugerido retornado pela API e a margem configurada, garantindo consistência entre cliente e servidor.
- **API**: os endpoints `/recipes` (POST/PATCH/GET) agora retornam o campo `profitMargin`, permitindo integrações que ajustem a margem dinamicamente.

### Controle de Compras
- Registro de compras de insumos
- Atualização automática de preços dos ingredientes
- Histórico de transações

### Despesas Operacionais
- Cadastro de custos fixos e variáveis
- Integração no cálculo de preço final
- Relatórios de despesas

## 📸 OCR de Notas Fiscais com Amazon Textract

- **Upload seguro**: a tela `AiScannerScreen` envia imagens/PDFs via `POST /ocr/textract`. O backend (`api/src/ocr/ocr.controller.ts`) valida tamanho e formato, salva o arquivo no S3 (quando `TEXTRACT_USE_S3=true`) e aciona o Textract (`AnalyzeExpenseCommand`).
- **Metadados & validação**: o serviço (`api/src/ocr/ocr.service.ts`) normaliza fornecedor, CNPJ, número e valor total. Cada item contém `issues[]` indicando inconsistências (`missing_description`, `missing_quantity`, `missing_total`, `missing_unit_price`, `low_confidence`, `unmatched_ingredient`).
- **Revisão na UI**: `AiScannerScreen` exibe badges de atenção, impede seleção de itens sem ingrediente vinculado e destaca confiança. Itens sem correspondência podem ser vinculados manualmente antes de confirmar.
- **Atualização de preços**: após a revisão, a UI vincula cada item válido e chama `/purchases` para registrar a compra. O serviço de compras (`api/src/purchases/purchases.service.ts`) cria `Purchase`/`PurchaseItem`, salva metadados e recalcula o custo dos ingredientes.
- **Monitoramento**: o serviço expõe `GET /ocr/metrics` (autenticado) com totais, tempo médio, taxa de falhas e alertas (latência > 5s ou falhas ≥ 20%). Use-o para integrar com dashboards ou alarmes externos.
- **Variáveis**: configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `TEXTRACT_BUCKET`, `TEXTRACT_USE_S3`, `TEXTRACT_MAX_FILE_SIZE_MB` e (opcional) `AWS_SESSION_TOKEN` em `api/.env`.
- **Fluxo recomendado**:
  1. Inicie a API (`pnpm run start:dev`) e o frontend (`pnpm run dev`).
  2. Acesse a lista de ingredientes, clique em **Escanear Nota Fiscal** e envie o arquivo.
  3. Revise as badges, vincule itens pendentes e confirme; os preços e a compra são salvos automaticamente.

### Configuração S3 Local

- **LocalStack**:
  1. Suba o serviço (`docker run -p 4566:4566 localstack/localstack`).
  2. Configure o endpoint no `.env` da API:

     ```env
     TEXTRACT_USE_S3="true"
     AWS_REGION="us-east-1"
     AWS_ACCESS_KEY_ID="test"
     AWS_SECRET_ACCESS_KEY="test"
     AWS_ENDPOINT_URL="http://localhost:4566"
     TEXTRACT_BUCKET="cooksmart-ocr-local"
     ````

  3. Crie o bucket: `awslocal s3 mb s3://cooksmart-ocr-local`.
- **MinIO**: utilize `docker run -p 9000:9000 -p 9090:9090 quay.io/minio/minio server /data` e mapeie `AWS_ENDPOINT_URL="http://localhost:9000"` (exige `TEXTRACT_USE_S3="true"`). Ajuste `AWS_REGION` para o valor esperado pelo MinIO.

> **Nota**: quando `AWS_ENDPOINT_URL` estiver definido, o SDK usará o endpoint customizado para operações S3, mantendo o Textract na AWS real.

### Políticas IAM Recomendadas

Crie uma role/usuário com a política mínima abaixo (substitua `<bucket-name>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["textract:AnalyzeExpense"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<bucket-name>/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::<bucket-name>"
    }
  ]
}
```

Mantenha chaves separadas para ambientes (produção, staging) e habilite MFA em usuários humanos.

### Fluxo OCR (Capturas de Tela)

- **Upload da nota**: `docs/screenshots/ocr-upload.png`.
- **Revisão e vinculação**: `docs/screenshots/ocr-review.png`.
- **Confirmação e alertas**: `docs/screenshots/ocr-confirm.png`.

> Salve as imagens no diretório `docs/screenshots/` para que os links acima sejam renderizados automaticamente no GitHub.

Exemplo de requisição manual (necessário token JWT válido):

```bash
curl -X POST http://localhost:3000/ocr/textract \
  -H "Authorization: Bearer <TOKEN>" \
  -F file=@nota-fiscal.pdf
```

## 📊 Funcionalidades Principais

### Gestão de Ingredientes
- Cadastro de ingredientes com nome, unidade de medida e preço unitário
- Histórico de compras e variação de preços

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

- [x] Implementação do módulo OCR com Amazon Textract e integração com compras
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
