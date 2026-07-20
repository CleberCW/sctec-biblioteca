# SCTEC Biblioteca

Sistema de gerenciamento de biblioteca desenvolvido em Node.js, TypeScript e PostgreSQL como parte do mini projeto da SCTEC.

O objetivo do projeto é fornecer uma aplicação de linha de comando para gerenciamento de livros, usuários e empréstimos, utilizando uma arquitetura em camadas e boas práticas de desenvolvimento.

## Funcionalidades

### Livros

- Cadastro de livros
- Edição de livros
- Busca por código de barras
- Busca por título
- Busca por autor
- Busca por palavras-chave (tags)
- Listagem paginada
- Controle de disponibilidade

### Usuários

- Cadastro
- Edição
- Consulta
- Listagem

### Empréstimos

- Registro de empréstimos
- Registro de devoluções
- Consulta de empréstimos ativos
- Histórico de empréstimos

### Relatórios

- Livros disponíveis
- Livros emprestados
- Livros por autor
- Quantidade de empréstimos por livro
- Usuários com empréstimos ativos

## Tecnologias

- Node.js
- TypeScript
- PostgreSQL
- Docker
- pg

## Estrutura do projeto

```text
src
├── @common
├── config
├── dtos
├── enums
├── errors
├── factories
├── models
├── repositories
├── services
├── views
└── main.ts
```

A aplicação está organizada em camadas:

- **Views**: interação com o usuário através do terminal.
- **Services**: regras de negócio.
- **Repositories**: acesso ao banco de dados.
- **Models**: entidades do domínio.
- **DTOs**: objetos utilizados para comunicação entre as camadas.

## Banco de dados

O sistema utiliza PostgreSQL.

As principais entidades são:

- Authors
- Books
- Tags
- BookTags
- Users
- BookLoans

Os relacionamentos foram modelados para permitir múltiplas tags por livro e manter o histórico de empréstimos realizados.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/CleberCW/sctec-biblioteca.git
cd sctec-biblioteca
```

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=biblioteca
DB_USER=postgres
DB_PASSWORD=postgres
```

Caso utilize Docker:

```bash
docker compose up -d
```

## Executando

Desenvolvimento:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Execução:

```bash
npm start
```

## Organização

A comunicação entre as camadas segue o fluxo:

```text
View
 ↓
Service
 ↓
Repository
 ↓
PostgreSQL
```

Essa separação facilita a manutenção da aplicação e reduz o acoplamento entre interface, regras de negócio e persistência.

## Melhorias futuras

Algumas funcionalidades que poderiam ser adicionadas em versões futuras:

- API REST
- Interface web
- Testes automatizados
- Sistema de autenticação
- Controle de reservas
- Controle de multas por atraso

## Autor

Cleber Leal

Projeto desenvolvido para fins de estudo e avaliação técnica.
