# API de Carteira Financeira

API RESTful para um sistema de carteira financeira, permitindo que usuários gerenciem saldos através de depósitos e transferências.

## Tecnologias Utilizadas

- Node.js v22
- NestJS
- TypeORM
- PostgreSQL
- JWT para autenticação
- Swagger para documentação
- Docker para containerização

## Funcionalidades

- Registro e autenticação de usuário
- Depósito de dinheiro na própria carteira
- Transferência de dinheiro para outros usuários
- Recebimento de transferências de outros usuários
- Reversão de transações

## Regras de Negócio

- Garantia de saldo suficiente antes de autorizar qualquer transferência
- Bloqueio de novos depósitos se o saldo de um usuário ficar negativo
- Sistema de reversão de transações em caso de inconsistências ou a pedido do usuário

## Configuração do Ambiente

### Pré-requisitos

- Node.js v22
- Docker e Docker Compose (opcional)
- PostgreSQL (se não estiver usando Docker)

### Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto com base no `env.example`:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações específicas.

### Criação do banco PostgreSQL localmente

Com o Postgre instalado na sua máquina execute os comandos abaixo:

psql -d postgres - Conectar no postgre em um banco já existente;

CREATE USER user_wallet WITH PASSWORD 'sua_senha'; - Criar o user da aplicação
CREATE DATABASE db_wallet; - Criar o database da aplicação
GRANT ALL PRIVILEGES ON DATABASE db_wallet TO user_wallet; - Configuar as permissões do usuário ao database


### Execução

#### Desenvolvimento

```bash
npm run start:dev
```

#### Produção

```bash
npm run build
npm run start:prod
```

#### Com Docker

```bash
docker-compose up -d
```

## Documentação da API

A documentação da API está disponível em:

```
http://localhost:3000/api/docs
```

## Endpoints Principais

### Autenticação

- `POST /api/auth/register` - Registrar um novo usuário
- `POST /api/auth/login` - Autenticar usuário

### Usuários

- `GET /api/users` - Listar todos os usuários
- `GET /api/users/:id` - Buscar um usuário pelo ID
- `PATCH /api/users/:id` - Atualizar um usuário
- `DELETE /api/users/:id` - Remover um usuário

### Carteira

- `GET /api/wallet/balance` - Obter saldo da carteira
- `GET /api/wallet/transactions` - Listar transações da carteira
- `POST /api/wallet/deposit` - Realizar depósito na carteira
- `POST /api/wallet/transfer` - Realizar transferência para outro usuário

### Transações

- `GET /api/transactions` - Listar todas as transações do usuário
- `GET /api/transactions/:id` - Buscar uma transação pelo ID
- `POST /api/transactions/reverse` - Reverter uma transação

### Health Check

- `GET /api/health` - Verificar saúde da aplicação e conexão com banco de dados

## Testes

### Testes Unitários

```bash
npm run test
```

### Cobertura de Testes

```bash
npm run test:cov
```