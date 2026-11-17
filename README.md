# JAKE Tecnologia – PIM IV

Sistema de gestão de contratos e chamados técnicos. API em ASP.NET Core 8 com SQL Server, painel web em React (Vite) e app mobile em React Native (Expo). Web e mobile consomem os mesmos endpoints REST.

```
backend/    API (Jake.Api), regras (Jake.Service), acesso a dados (Jake.Repository), entidades e DTOs (Jake.Domain), testes
frontend/   painel web, servido por nginx no Docker
mobile/     app Expo com modo offline
database/   schema e procedure sp_AbrirChamado em SQL puro (as migrations do EF aplicam o mesmo conteúdo)
```

## Subindo com Docker

Precisa de Docker com Compose e das portas 1433, 8080 e 3000 livres.

```bash
cp .env.example .env
docker compose up -d --build
```

Variáveis do `.env`:

- `SA_PASSWORD`: senha do SQL Server. Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
- `JWT_KEY`: 32 caracteres ou mais. Com menos, a API não sobe.
- `SEED_GERENTE_EMAIL` / `SEED_GERENTE_SENHA`: Gerente inicial, criado só se o banco estiver vazio.
- `SEED_FUNCIONARIO_EMAIL` / `SEED_FUNCIONARIO_SENHA`: Funcionário de demonstração (padrão `func@jake.local` / `Func@12345`).

Na primeira subida a API aplica as migrations e cria os usuários de demonstração. O SQL Server leva uns 30 s para aceitar conexões; a API fica tentando até conseguir.

| Serviço | Endereço |
|---|---|
| Painel web | http://localhost:3000 |
| API | http://localhost:8080/api |
| Swagger | http://localhost:8080/swagger |
| Health check | http://localhost:8080/health/ready |
| SQL Server | `localhost,1433`, usuário `sa`, senha `SA_PASSWORD`, banco `JakeDb` |

Comandos do dia a dia:

```bash
docker compose ps                    # estado dos serviços
docker compose logs -f api           # logs da API
docker compose up -d --build api     # reconstrói só a API
docker compose stop                  # para sem apagar dados
docker compose down -v               # apaga contêineres e o volume do banco
```

## Contas de teste

Criadas na inicialização da API se o e-mail ainda não existir. Valem para web e mobile.

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `c1@t.com` | `12345678` |
| Funcionário | `func@jake.local` | `Func@12345` |
| Gerente | `eduardo@jake.local` | `Gerente@123` |
| Gerente | `jheniffer@jake.local` | `Gerente@123` |
| Gerente | `karolaine@jake.local` | `Gerente@123` |
| Gerente | `arthur@jake.local` | `Gerente@123` |
| Gerente | `emy@jake.local` | `Gerente@123` |
| Gerente inicial | `SEED_GERENTE_EMAIL` | `SEED_GERENTE_SENHA` |

O Cliente `c1@t.com` não faz parte do seed. Num banco novo (depois de `docker compose down -v`), crie pelo cadastro público, que sempre gera um Cliente:

```bash
curl -X POST http://localhost:8080/api/auth/registrar \
  -H "Content-Type: application/json" \
  -d '{"nome":"Cliente Teste","email":"c1@t.com","senha":"12345678","perfil":1}'
```

Para abrir chamado, o cliente precisa de um contrato Ativo e dentro da vigência. Entre como Gerente, cadastre o contrato em *Contratos* e depois abra o chamado como Cliente.

São contas de demonstração. Fora do ambiente local, troque ou remova.

## Perfis

- **Cliente:** abre e acompanha os próprios chamados e conversa com a equipe no histórico.
- **Funcionário:** atende a fila, responde e altera a situação dos chamados.
- **Gerente:** tudo do Funcionário, mais contratos, painel de indicadores e relatórios em CSV.

Situações de chamado: 1 Aberto, 2 Em atendimento, 3 Resolvido, 4 Fechado. A primeira resposta da equipe passa o chamado de Aberto para Em atendimento; o cliente pode reabrir um chamado Fechado.

## Painel web em modo dev

Com a API rodando no Docker:

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173, /api é repassado para localhost:8080
```

## App mobile

Com a API no ar:

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

Ajuste `EXPO_PUBLIC_API_URL` no `mobile/.env`:

| Onde roda | Valor |
|---|---|
| Emulador Android | `http://10.0.2.2:8080` |
| Simulador iOS | `http://localhost:8080` |
| Celular físico (Expo Go) | `http://<IP-do-PC>:8080`, na mesma rede Wi-Fi |

Depois de mudar o `.env`, reinicie com `npx expo start -c`.

No celular, leia o QR Code com o Expo Go. No emulador Android, tecle `a`; no simulador iOS, `i`.

O app funciona offline: os dados ficam em cache e chamados abertos sem internet entram numa fila local, enviada quando a conexão volta. Cada chamado leva uma chave de idempotência, então reenvios não duplicam. Os tokens ficam no Keychain/Keystore via `expo-secure-store`, com renovação automática por refresh token.

Celular físico com a API dentro do WSL2: libere a porta 8080 no firewall e encaminhe a porta do Windows para o WSL (PowerShell como administrador):

```powershell
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<IP-do-WSL>
```

## Roteiro da apresentação

1. `docker compose up -d --build` e aguarde uns 30 s.
2. Web como Gerente: cadastre um contrato para `c1@t.com`.
3. Mobile como Cliente: abra um chamado.
4. Web como Funcionário: responda o chamado e mude a situação.
5. Web como Gerente: mostre o painel de indicadores e baixe um relatório CSV.
6. Mobile em modo avião: abra um chamado, religue a internet e veja a sincronização.

## Testes

```bash
cd backend && dotnet test                    # xUnit
cd frontend && npm run build                 # typecheck + build
cd mobile && npx tsc --noEmit && npm test    # typecheck + lógica, sem rede
```

Integração do mobile contra a API real (o cliente precisa de contrato ativo e vigente):

```bash
cd mobile
JAKE_API_URL=http://localhost:8080 JAKE_TEST_EMAIL=c1@t.com JAKE_TEST_SENHA=12345678 npm run test:integration
```

## Banco de dados

- Migrations em `backend/src/Jake.Repository/Migrations`, aplicadas na inicialização da API.
- `sp_AbrirChamado` (migration `AddSpAbrirChamado`, também em `database/02_sp_AbrirChamado.sql`) revalida o contrato dentro de uma transação. A regra de vigência é checada no Service, para dar resposta rápida, e de novo no banco.
- Nova migration: `dotnet ef migrations add <Nome> -p src/Jake.Repository -s src/Jake.Api -o Migrations` (a partir de `backend/`).

## Endpoints

| Rota | Quem |
|---|---|
| `POST /api/auth/login`, `/registrar`, `/refresh`, `/logout`; `GET /api/auth/me` | público / autenticado |
| `GET, POST /api/contratos`; `GET, PUT, DELETE /api/contratos/{id}` | Gerente |
| `GET /api/meus-contratos` | Cliente |
| `POST /api/chamados`; `GET /api/chamados/meus?status=` | Cliente |
| `GET /api/chamados` | Funcionário, Gerente |
| `GET /api/chamados/{id}`; `POST /api/chamados/{id}/mensagens`; `PATCH /api/chamados/{id}/status` | conforme o perfil |
| `GET /api/painel/chamados`, `/indicadores`; `PATCH /api/painel/contratos/{id}/status` | Gerente |
| `GET /api/relatorios/resumo`, `/chamados`, `/contratos` (`?formato=csv`) | Gerente |
| `GET /api/usuarios?perfil=1` | Gerente |

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| API não conecta ao banco | `docker compose logs db`; confira se `SA_PASSWORD` atende à complexidade |
| Trocou `SA_PASSWORD` e o banco recusa | O volume guarda a senha antiga: `docker compose down -v` (apaga os dados) |
| API cai com erro de `Jwt:Key` | `JWT_KEY` com menos de 32 caracteres |
| Login retorna 429 | Limite de tentativas por IP nas rotas de auth; aguarde 1 minuto |
| App mostra erro de rede | `EXPO_PUBLIC_API_URL` errada, celular em outra rede ou firewall bloqueando a 8080 |
| Swagger não abre | Só fica ativo com `ASPNETCORE_ENVIRONMENT=Development`, o padrão do Compose |
| Não consigo abrir chamado | Cliente sem contrato Ativo e vigente |
