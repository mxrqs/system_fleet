# Sistema Fleet - Controle Administrativo

Um sistema completo de gerenciamento administrativo construído com **React**, **TypeScript**, **tRPC**, **Drizzle ORM** e **MySQL**.

## 🎯 Funcionalidades

- **Autenticação e Autorização**: Sistema de login com JWT e controle de acesso baseado em roles (admin, user, estoquista)
- **Gerenciamento de Ordens**: Criar, visualizar, editar e finalizar ordens de serviço
- **Inventário**: Controle de estoque com suporte a código de barras
- **Contratos**: Gerenciamento de contratos com fornecedores
- **Checklists**: Inspeção com assinatura digital
- **Alertas de Manutenção**: Monitoramento de manutenção preventiva
- **Frota**: Gerenciamento de veículos
- **Planos de Manutenção**: Agendamento de manutenção preventiva
- **Dashboard**: Visualização de estatísticas e métricas

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e pnpm
- MySQL 8.0+
- Git

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/mxrqs/system_fleet.git
   cd system_fleet
   ```

2. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   DATABASE_URL=mysql://user:password@localhost:3306/system_fleet
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=sua-chave-secreta-aqui
   ```

3. **Instale as dependências**
   ```bash
   pnpm install
   ```

4. **Configure o banco de dados**
   ```bash
   pnpm db:push
   ```

5. **Inicie o servidor de desenvolvimento**
   ```bash
   pnpm dev
   ```

   O servidor estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
system_fleet/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── contexts/      # Context API
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
│   └── public/            # Arquivos estáticos
├── server/                # Backend Node.js/Express
│   ├── _core/
│   │   ├── index.ts       # Configuração do servidor
│   │   ├── db.ts          # Conexão com banco de dados
│   │   └── auth.ts        # Lógica de autenticação
│   └── routers/           # Rotas tRPC
├── shared/                # Código compartilhado
├── drizzle/               # Migrações e schema do banco
└── package.json           # Dependências do projeto
```

## 🔐 Autenticação

### Login

```typescript
const { user, token } = await trpc.auth.login.mutate({
  username: "admin",
  password: "password123"
});

// Armazene o token no localStorage
localStorage.setItem("authToken", token);
```

### Usando o Token

Todas as requisições protegidas devem incluir o token no header:

```
Authorization: Bearer <seu-token-jwt>
```

## 📚 API Endpoints

### Autenticação

- `POST /api/trpc/auth.login` - Login com username/password
- `GET /api/trpc/auth.me` - Obter informações do usuário atual
- `POST /api/trpc/auth.logout` - Logout
- `POST /api/trpc/auth.createUser` - Criar novo usuário (admin only)
- `GET /api/trpc/auth.listUsers` - Listar usuários (admin only)
- `POST /api/trpc/auth.deleteUser` - Deletar usuário (admin only)
- `POST /api/trpc/auth.updatePassword` - Atualizar senha

### Contratos

- `GET /api/trpc/contracts.list` - Listar contratos
- `POST /api/trpc/contracts.create` - Criar contrato
- `POST /api/trpc/contracts.delete` - Deletar contrato

### Ordens

- `GET /api/trpc/orders.list` - Listar ordens
- `POST /api/trpc/orders.create` - Criar ordem
- `GET /api/trpc/orders.getById` - Obter ordem por ID
- `POST /api/trpc/orders.delete` - Deletar ordem

### Inventário

- `GET /api/trpc/inventory.list` - Listar itens
- `POST /api/trpc/inventory.createItem` - Criar item
- `POST /api/trpc/inventory.deleteItem` - Deletar item
- `GET /api/trpc/inventory.getByBarcode` - Buscar por código de barras

### Manutenção

- `GET /api/trpc/maintenanceAlerts.list` - Listar alertas
- `POST /api/trpc/maintenanceAlerts.create` - Criar alerta
- `POST /api/trpc/maintenanceAlerts.resolve` - Resolver alerta
- `GET /api/trpc/maintenancePlans.list` - Listar planos
- `POST /api/trpc/maintenancePlans.create` - Criar plano

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar servidor em produção
pnpm start

# Verificar tipos TypeScript
pnpm check

# Formatar código
pnpm format

# Executar testes
pnpm test

# Push de migrações do banco de dados
pnpm db:push
```

## 🛠️ Tecnologias

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **tRPC Client** - API communication
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Express** - Web framework
- **tRPC** - Type-safe API
- **Drizzle ORM** - Database ORM
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📝 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão MySQL | `mysql://user:pass@localhost:3306/db` |
| `NODE_ENV` | Ambiente | `development` ou `production` |
| `PORT` | Porta do servidor | `3000` |
| `JWT_SECRET` | Chave secreta JWT | `sua-chave-secreta` |
| `AWS_REGION` | Região AWS (opcional) | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Chave de acesso AWS (opcional) | |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta AWS (opcional) | |
| `AWS_S3_BUCKET` | Bucket S3 (opcional) | |

## 🐛 Troubleshooting

### Erro: "DATABASE_URL is required"
Certifique-se de que o arquivo `.env` está configurado corretamente com a variável `DATABASE_URL`.

### Erro: "UNAUTHORIZED"
Verifique se o token JWT está sendo enviado corretamente no header `Authorization: Bearer <token>`.

### Erro de conexão com banco de dados
- Verifique se o MySQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `mysql -u user -p -h localhost`

## 📄 Licença

MIT

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

## 📞 Suporte

Para suporte, abra uma issue no repositório GitHub.
