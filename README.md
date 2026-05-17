# PIM - Sistema de Contratos JKE

Projeto com:

- `backend/`: API Node.js/Express
- `frontend/`: frontend estatico servido por Nginx
- `sqlserver`: banco SQL Server Express via Docker

O ambiente foi dockerizado para subir tudo com um unico comando.

## Subir o sistema completo

Na raiz do projeto, rode:

```powershell
docker compose up -d --build
```

Depois acesse:

```text
http://localhost
```

O frontend sera servido na porta `80`, com proxy para o backend.

## O que sobe no Docker Compose

- `frontend`: Nginx servindo as paginas HTML em `http://localhost`
- `backend`: API Node.js em `http://localhost:3000`
- `sqlserver`: SQL Server Express em `localhost:1433`
- `sqlserver-init`: container de inicializacao que cria o banco e as tabelas automaticamente

## Banco criado automaticamente

Ao subir o Compose, o projeto cria o banco `SistemaContratos` e as tabelas:

- `CTO`
- `SP`
- `SI`
- `CS`
- `CHAMADO`

Esse processo eh idempotente, entao pode rodar novamente sem recriar tudo do zero.

## Credenciais padrao do SQL Server

Por padrao, o Compose usa:

```text
usuario: sa
senha: YourStrong!Passw0rd
```

Se quiser trocar a senha, crie um arquivo `.env` na raiz com:

```env
SA_PASSWORD=SuaSenhaForte123!
```

Depois rode o Compose normalmente:

```powershell
docker compose up -d --build
```

Observacao: o SQL Server exige senha forte.

## Como acessar

- Sistema completo: `http://localhost`
- API backend: `http://localhost:3000`
- SQL Server: `localhost,1433`

Paginas disponiveis no frontend:

- `http://localhost/cadastro_contrato.html`
- `http://localhost/chamado.html`
- `http://localhost/pagina_gerente.html`

## Comandos uteis

Subir em background:

```powershell
docker compose up -d
```

Ver logs:

```powershell
docker compose logs -f
```

Parar tudo:

```powershell
docker compose down
```

Parar tudo e remover volume do banco:

```powershell
docker compose down -v
```

## Estrutura adicionada para Docker

- [docker-compose.yml](/C:/Users/Aerlo/Downloads/PIM/docker-compose.yml)
- [backend/Dockerfile](/C:/Users/Aerlo/Downloads/PIM/backend/Dockerfile)
- [frontend/Dockerfile](/C:/Users/Aerlo/Downloads/PIM/frontend/Dockerfile)
- [frontend/nginx.conf](/C:/Users/Aerlo/Downloads/PIM/frontend/nginx.conf)
- [docker/sqlserver/init.sql](/C:/Users/Aerlo/Downloads/PIM/docker/sqlserver/init.sql)
- [docker/sqlserver/init-db.sh](/C:/Users/Aerlo/Downloads/PIM/docker/sqlserver/init-db.sh)

## Execucao sem Docker

Se ainda quiser rodar o backend manualmente, existe um modelo em [backend/.env.example](/C:/Users/Aerlo/Downloads/PIM/backend/.env.example).

## Observacoes importantes

- O nome da pasta do frontend permanece `frontend` para nao quebrar referencias ja existentes.
- O frontend agora consome a API por `/api/...`, o que permite usar somente `http://localhost` no navegador.
- O backend foi ajustado para esperar a disponibilidade do SQL Server antes de iniciar completamente.
