# Guia de Configuração - System Fleet

Este guia detalha os passos necessários para configurar e executar o projeto **System Fleet** em seu ambiente local.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18.0.0 ou superior
- **pnpm** 10.0.0 ou superior (gerenciador de pacotes)
- **MySQL** 8.0 ou superior
- **Git**

### Verificar Versões

```bash
node --version      # v18.0.0 ou superior
pnpm --version      # 10.0.0 ou superior
mysql --version     # 8.0 ou superior
```

## 🔧 Configuração Inicial

### 1. Clonar o Repositório

```bash
git clone https://github.com/mxrqs/system_fleet.git
cd system_fleet
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database Configuration
DATABASE_URL=mysql://root:password@localhost:3306/system_fleet

# Server Configuration
NODE_ENV=development
PORT=3000

# JWT Secret (altere em produção!)
JWT_SECRET=sua-chave-secreta-super-segura-aqui

# AWS S3 Configuration (opcional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=seu-access-key
AWS_SECRET_ACCESS_KEY=seu-secret-key
AWS_S3_BUCKET=seu-bucket-name

# API Configuration
VITE_API_URL=http://localhost:3000

# Application Title
VITE_APP_TITLE=Controle Administrativo
```

### 3. Criar Banco de Dados

Conecte-se ao MySQL e crie o banco de dados:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE system_fleet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Instalar Dependências

```bash
pnpm install
```

### 5. Executar Migrações do Banco de Dados

```bash
pnpm db:push
```

Este comando irá:
- Criar todas as tabelas necessárias
- Configurar os índices
- Aplicar as constraints

### 6. Criar Usuário Admin Inicial

Você pode criar um usuário admin através da API ou diretamente no banco de dados:

#### Opção A: Via API (após iniciar o servidor)

```bash
curl -X POST http://localhost:3000/api/trpc/auth.createUser \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token-admin>" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "admin",
    "empresa": "GP"
  }'
```

#### Opção B: Via MySQL (antes de iniciar)

```bash
mysql -u root -p system_fleet
```

```sql
-- Inserir usuário admin (senha: admin123)
INSERT INTO app_users (username, passwordHash, role, empresa, createdAt, updatedAt) 
VALUES ('admin', '$2a$10$...', 'admin', 'GP', NOW(), NOW());
```

## 🚀 Executar o Projeto

### Modo Desenvolvimento

```bash
pnpm dev
```

O servidor estará disponível em:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **API tRPC**: http://localhost:3000/api/trpc

### Modo Produção

```bash
# Build
pnpm build

# Iniciar servidor
pnpm start
```

## 🗄️ Gerenciamento do Banco de Dados

### Visualizar Banco de Dados com Drizzle Studio

```bash
pnpm drizzle-kit studio
```

Isso abrirá uma interface visual em `http://localhost:5555` onde você pode:
- Visualizar tabelas e dados
- Executar queries
- Gerenciar registros

### Executar Migrações

```bash
# Push de migrações
pnpm db:push

# Gerar migrações
pnpm drizzle-kit generate
```

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Executar testes com watch
pnpm test:watch
```

## 📝 Verificação de Tipos

```bash
# Verificar tipos TypeScript
pnpm check
```

## 🎨 Formatação de Código

```bash
# Formatar código com Prettier
pnpm format
```

## 🔐 Autenticação

### Fluxo de Login

1. **Enviar credenciais**
   ```bash
   POST /api/trpc/auth.login
   {
     "username": "admin",
     "password": "admin123"
   }
   ```

2. **Receber token JWT**
   ```json
   {
     "user": {
       "id": 1,
       "username": "admin",
       "role": "admin",
       "empresa": "GP"
     },
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. **Usar token em requisições**
   ```bash
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 🐛 Troubleshooting

### Erro: "DATABASE_URL is required"

**Solução**: Certifique-se de que o arquivo `.env` existe e contém a variável `DATABASE_URL`.

```bash
cat .env | grep DATABASE_URL
```

### Erro: "Connection refused" (MySQL)

**Solução**: Verifique se o MySQL está rodando:

```bash
# macOS/Linux
sudo systemctl status mysql

# Iniciar MySQL se não estiver rodando
sudo systemctl start mysql

# Windows
net start MySQL80
```

### Erro: "UNAUTHORIZED" em requisições

**Solução**: Verifique se o token JWT está sendo enviado corretamente:

```bash
# Verificar se o token está no header
curl -H "Authorization: Bearer <seu-token>" http://localhost:3000/api/trpc/auth.me
```

### Erro: "Table doesn't exist"

**Solução**: Execute as migrações do banco de dados:

```bash
pnpm db:push
```

### Erro: "Port 3000 already in use"

**Solução**: Mude a porta no arquivo `.env`:

```env
PORT=3001
```

Ou mate o processo usando a porta:

```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 📚 Estrutura de Diretórios

```
system_fleet/
├── client/                      # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── pages/              # Páginas da aplicação
│   │   ├── contexts/           # Context API
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilitários
│   │   ├── App.tsx             # Componente raiz
│   │   └── main.tsx            # Ponto de entrada
│   ├── public/                 # Arquivos estáticos
│   └── index.html              # HTML principal
├── server/                      # Backend Node.js/Express
│   ├── _core/
│   │   ├── index.ts            # Configuração do servidor
│   │   ├── db.ts               # Conexão com banco de dados
│   │   └── auth.ts             # Lógica de autenticação
│   └── routers/
│       ├── index.ts            # Roteadores principais
│       └── auth.ts             # Roteador de autenticação
├── shared/                      # Código compartilhado
│   └── const.ts                # Constantes
├── drizzle/                     # ORM e Migrações
│   ├── schema.ts               # Definição do schema
│   ├── relations.ts            # Relações entre tabelas
│   ├── migrations/             # Arquivos de migração
│   └── meta/                   # Metadados do Drizzle
├── .env.example                # Exemplo de variáveis de ambiente
├── .env                        # Variáveis de ambiente (não commitar!)
├── package.json                # Dependências do projeto
├── tsconfig.json               # Configuração do TypeScript
├── vite.config.ts              # Configuração do Vite
├── drizzle.config.ts           # Configuração do Drizzle
├── README.md                   # Documentação principal
└── SETUP.md                    # Este arquivo
```

## 🚢 Deploy

### Deploy no Vercel (Frontend) + Railway (Backend)

1. **Frontend no Vercel**
   ```bash
   vercel deploy
   ```

2. **Backend no Railway**
   - Conectar repositório GitHub
   - Configurar variáveis de ambiente
   - Deploy automático

### Deploy em VPS com Docker

Veja o arquivo `Dockerfile` para instruções de containerização.

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique a documentação em `README.md`
2. Abra uma issue no GitHub
3. Consulte a seção de Troubleshooting acima

## 📄 Licença

MIT - Veja LICENSE para detalhes
