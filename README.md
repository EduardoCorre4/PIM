# JAKE Tecnologia – PIM IV

## Subir o banco de dados e a API localmente (Docker Compose)

Pré-requisito: Docker com o plugin Compose (`docker --version` e `docker compose version` devem funcionar). As portas 1433, 8080 e 3000 precisam estar livres.

1. Entre na pasta do projeto:

       cd ~/PIM

2. Crie o arquivo de variáveis a partir do modelo:

       cp .env.example .env

3. Edite o `.env`:
   - `SA_PASSWORD`: senha do SQL Server (mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo).
   - `JWT_KEY`: chave aleatória com 32 caracteres ou mais.
   - `SEED_GERENTE_EMAIL` e `SEED_GERENTE_SENHA`: login do primeiro Gerente, criado se o banco estiver vazio.
   - `SEED_FUNCIONARIO_EMAIL` e `SEED_FUNCIONARIO_SENHA` (opcionais, padrão `func@jake.local` / `Func@12345`): Funcionário de demonstração, criado se o e-mail ainda não existir.

4. Construa as imagens e suba os serviços:

       docker compose up -d --build

   Na primeira vez a API aplica as migrations e cria o Gerente inicial. O banco pode levar cerca de 30 segundos para aceitar conexões; a API tenta de novo até conseguir.

5. Confira se os três serviços estão no ar e acompanhe os logs da API:

       docker compose ps
       docker compose logs -f api

6. Teste:
   - API: http://localhost:8080/api (Swagger em http://localhost:8080/swagger)
   - Painel web: http://localhost:3000 (entre com o Gerente do `.env`)
   - Banco: `localhost,1433`, usuário `sa`, senha `SA_PASSWORD`, banco `JakeDb`.

Comandos úteis:

    docker compose stop             # para sem apagar dados
    docker compose up -d            # sobe de novo
    docker compose down -v          # apaga contêineres E o volume do banco (recomeça do zero)
    docker compose up -d --build api   # reconstrói só a API após mudar o código

Se a API não conectar ao banco, veja `docker compose logs db` e confirme que a `SA_PASSWORD` atende aos requisitos de complexidade. Depois de trocar a senha com o volume já criado, rode `docker compose down -v` antes de subir de novo.

## Front-end (React + Vite)
    cd frontend && npm install && npm run dev   # http://localhost:5173, /api é repassado para localhost:8080
Todos os perfis entram no web: Cliente (abre e acompanha chamados), Funcionário (fila e alteração de situação) e Gerente (também contratos, resumo e relatórios). Credenciais de teste na página inicial.
Acessibilidade: link "pular para o conteúdo", letra ajustável (A−/A/A+), modo de alto contraste, foco visível e navegação só por teclado; as preferências ficam salvas no navegador.

Novo endpoint: `GET /api/usuarios?perfil=1` (Gerente) lista os clientes para o formulário de contrato.

## Endpoints (Sprint 1)
- `POST /api/auth/login`, `POST /api/auth/registrar` (público cria só Cliente; Funcionário/Gerente exige Gerente), `GET /api/auth/me`
- `GET/POST /api/contratos`, `GET/PUT/DELETE /api/contratos/{id}` (somente Gerente)

## Endpoints (Sprint 2)
- `POST /api/chamados` (Cliente), `GET /api/chamados/meus?status=` (Cliente), `GET /api/chamados` (fila, Gerente/Funcionário), `GET /api/chamados/{id}`, `PATCH /api/chamados/{id}/status` (Gerente/Funcionário)
- `GET /api/painel/chamados?status=`, `GET /api/painel/indicadores`, `PATCH /api/painel/contratos/{id}/status` (Gerente); edição completa de contrato: `PUT /api/contratos/{id}`
- Status de chamado: 1=Aberto, 2=EmAndamento, 3=Resolvido, 4=Fechado

## App mobile (React Native + Expo) — Sprint 3
    cd mobile && npm install && cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL
    npx expo start                                        # abra no Expo Go (Android/iOS)
- Endereço da API: emulador Android `http://10.0.2.2:8080`; celular físico `http://<IP-do-PC>:8080` (mesma rede).
- Todos os perfis entram no app: Cliente abre/acompanha os próprios chamados; Funcionário e Gerente veem a fila e alteram a situação (exige internet). Tokens ficam no Keychain/Keystore (`expo-secure-store`); renovação automática com refresh token.
- Offline-first: dados em cache local e fila de chamados (`mobile/src/core`), enviada ao voltar a internet. Cada chamado leva uma chave de idempotência, então reenvios nunca duplicam.
- Testes: `npm test` (lógica, sem rede) e `npm run test:integration` (contra a API; veja o cabeçalho do arquivo).
- Novos endpoints: `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/meus-contratos` (Cliente).

## Sprint 4 — relatórios
- **Relatórios (PB07):** tela *Relatórios* no painel web (período, situação, indicadores e download em CSV para Excel). API: `GET /api/relatorios/resumo`, `/chamados` e `/contratos` (`?formato=csv`), somente Gerente.
- **Testes do back-end:** `cd backend && dotnet test`.

## Contas de teste
Criadas na inicialização da API se o e-mail ainda não existir. Todos os perfis entram no Web e no Mobile.

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `c1@t.com` | `12345678` |
| Funcionário | `func@jake.local` | `Func@12345` |
| Gerente | `eduardo@jake.local` | `Gerente@123` |
| Gerente | `jheniffer@jake.local` | `Gerente@123` |
| Gerente | `karolaine@jake.local` | `Gerente@123` |
| Gerente | `arthur@jake.local` | `Gerente@123` |
| Gerente | `emy@jake.local` | `Gerente@123` |

## Banco
`sp_AbrirChamado`: migration `AddSpAbrirChamado` / `database/02_sp_AbrirChamado.sql`.
Migrations em `backend/src/Jake.Repository/Migrations`; script SQL em `database/01_schema.sql`.
Nova migration: `dotnet ef migrations add <Nome> -p src/Jake.Repository -s src/Jake.Api -o Migrations`
