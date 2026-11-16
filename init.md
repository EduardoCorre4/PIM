# Como subir e rodar o sistema — JAKE Tecnologia (PIM IV)

Guia passo a passo para colocar no ar o banco, a API, o painel web (desktop) e o app mobile.

## 1. Pré-requisitos

| Para | Precisa de |
|---|---|
| Banco + API + painel web (Docker) | Docker com Compose (`docker --version` e `docker compose version`) |
| Painel web em modo desenvolvimento (opcional) | Node.js 22+ e npm |
| App mobile | Node.js 22+, npm e o app **Expo Go** no celular (ou um emulador Android/iOS) |
| Testes do back-end (opcional) | .NET SDK 8 |

Portas livres: **1433** (SQL Server), **8080** (API), **3000** (painel web) e **5173** (só no modo dev do web).

## 2. Configurar as variáveis de ambiente

Na raiz do projeto:

```bash
cd ~/PIM
cp .env.example .env
```

Edite o `.env`:

| Variável | O que é |
|---|---|
| `SA_PASSWORD` | Senha do SQL Server. Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo |
| `JWT_KEY` | Chave aleatória com **32 caracteres ou mais** (a API não inicia com menos) |
| `SEED_GERENTE_EMAIL` / `SEED_GERENTE_SENHA` | Login do primeiro Gerente, criado se o banco estiver vazio |
| `SEED_FUNCIONARIO_EMAIL` / `SEED_FUNCIONARIO_SENHA` | Funcionário de demonstração (opcional; padrão `func@jake.local` / `Func@12345`) |

## 3. Subir banco + API + painel web

```bash
docker compose up -d --build
```

Na primeira vez a API aplica as migrations e cria os usuários iniciais. O banco leva cerca de 30 segundos para aceitar conexões; a API tenta de novo sozinha.

Confira:

```bash
docker compose ps               # db, api e web devem estar "running"
docker compose logs -f api      # acompanha a API (Ctrl+C para sair)
```

| Serviço | Endereço |
|---|---|
| Painel web | http://localhost:3000 |
| API | http://localhost:8080/api |
| Swagger | http://localhost:8080/swagger |
| Saúde da API | http://localhost:8080/health/ready |
| SQL Server | `localhost,1433` — usuário `sa`, senha `SA_PASSWORD`, banco `JakeDb` |

## 4. Usar no desktop (painel web)

1. Abra http://localhost:3000 no navegador.
2. Clique em entrar e use uma das contas de teste (seção 6).
3. O menu muda conforme o perfil:
   - **Cliente:** abre e acompanha os próprios chamados.
   - **Funcionário:** vê a fila de chamados e altera a situação.
   - **Gerente:** também gerencia contratos, vê o painel de indicadores e baixa relatórios em CSV.

### Modo desenvolvimento do web (opcional, com recarga automática)

Com a API já rodando no Docker:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 ; /api é repassado para localhost:8080
```

## 5. Usar no mobile (React Native + Expo)

A API precisa estar no ar (seção 3).

### 5.1 Instalar e configurar

```bash
cd mobile
npm install
cp .env.example .env
```

Edite `mobile/.env` e ajuste `EXPO_PUBLIC_API_URL` conforme onde o app vai rodar:

| Onde roda | Valor de `EXPO_PUBLIC_API_URL` |
|---|---|
| Emulador Android | `http://10.0.2.2:8080` |
| Simulador iOS | `http://localhost:8080` |
| Celular físico (Expo Go) | `http://<IP-do-seu-PC>:8080` — celular e PC na **mesma rede Wi-Fi** |

Para descobrir o IP do PC: Linux/macOS `hostname -I` ou `ipconfig getifaddr en0`; Windows `ipconfig`.

### 5.2 Iniciar

```bash
npx expo start
```

- **Celular físico:** instale o **Expo Go** (Play Store / App Store) e leia o QR Code exibido no terminal.
- **Emulador Android:** com o emulador aberto, pressione `a` no terminal (ou `npm run android`).
- **Simulador iOS (somente macOS):** pressione `i` (ou `npm run ios`).

Se mudar o `.env`, reinicie com `npx expo start -c` para limpar o cache.

### 5.3 Usar o app

1. Entre com uma conta de teste (seção 6). Todos os perfis entram no app.
2. **Cliente:** abre e acompanha os próprios chamados.
3. **Funcionário/Gerente:** veem a fila e alteram a situação (exige internet).
4. **Teste do modo offline:** com o app aberto, ative o modo avião e abra um chamado. Ele fica na fila local; ao religar a internet, é enviado automaticamente, sem duplicar.

### 5.4 Observações para celular físico

- Se o app não alcançar a API, libere a porta **8080** no firewall do PC.
- No **WSL2** (Windows), a API fica na rede do WSL: use o IP do Windows e encaminhe a porta, por exemplo (PowerShell como administrador):
  ```powershell
  netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<IP-do-WSL>
  ```
  O IP do WSL aparece com `hostname -I` dentro dele.

## 6. Contas de teste

Criadas na inicialização da API, se o e-mail ainda não existir. Valem para web e mobile.

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `c1@t.com` | `12345678` |
| Funcionário | `func@jake.local` | `Func@12345` |
| Gerente | `eduardo@jake.local` | `Gerente@123` |
| Gerente | `jheniffer@jake.local` | `Gerente@123` |
| Gerente | `karolaine@jake.local` | `Gerente@123` |
| Gerente | `arthur@jake.local` | `Gerente@123` |
| Gerente | `emy@jake.local` | `Gerente@123` |
| Gerente inicial | valor de `SEED_GERENTE_EMAIL` | valor de `SEED_GERENTE_SENHA` |

> Só para demonstração. Troque ou remova essas contas fora de um ambiente local.

Para abrir um chamado, o cliente precisa de um **contrato Ativo e dentro da vigência**. Entre como Gerente, crie um contrato para o cliente (menu *Contratos*) e depois abra o chamado como Cliente.

## 7. Roteiro rápido para a apresentação

1. `docker compose up -d --build` e aguarde ~30 s.
2. Web (http://localhost:3000) como **Gerente**: crie um contrato para o cliente `c1@t.com`.
3. Mobile como **Cliente** (`c1@t.com`): abra um chamado.
4. Web como **Funcionário** ou **Gerente**: veja o chamado na fila e mude a situação.
5. Web como **Gerente**: abra o painel de indicadores e baixe um relatório CSV.
6. Mobile: demonstre o modo avião (chamado offline, depois sincronização).

## 8. Testes

```bash
# Back-end (xUnit)
cd backend && dotnet test

# Mobile: lógica, sem rede
cd mobile && npm test

# Mobile: integração contra a API real (cliente precisa de contrato ativo e vigente)
cd mobile
JAKE_API_URL=http://localhost:8080 JAKE_TEST_EMAIL=c1@t.com JAKE_TEST_SENHA=12345678 npm run test:integration
```

## 9. Comandos úteis do Docker

```bash
docker compose stop                  # para, sem apagar dados
docker compose up -d                 # sobe de novo
docker compose up -d --build api     # reconstrói só a API após mudar o código
docker compose logs -f api           # logs da API
docker compose logs db               # logs do banco
docker compose down -v               # APAGA contêineres E o banco (recomeça do zero)
```

## 10. Problemas comuns

| Sintoma | Causa provável e solução |
|---|---|
| API não conecta ao banco | Veja `docker compose logs db`. Confirme que `SA_PASSWORD` atende à complexidade exigida |
| Trocou `SA_PASSWORD` e o banco não aceita | O volume guarda a senha antiga. Rode `docker compose down -v` e suba de novo (apaga os dados) |
| API cai ao iniciar com erro de `Jwt:Key` | `JWT_KEY` com menos de 32 caracteres |
| Porta já em uso (1433, 8080, 3000) | Libere a porta ou encerre o processo que a usa |
| Login retorna 429 | Limite de tentativas por IP nas rotas de autenticação. Aguarde 1 minuto |
| App mobile: "erro de rede" | `EXPO_PUBLIC_API_URL` errada para o seu cenário (seção 5.1), celular em outra rede, ou firewall bloqueando a 8080 |
| Alterou `mobile/.env` e nada mudou | Reinicie com `npx expo start -c` |
| Swagger não abre | Só fica ativo com `ASPNETCORE_ENVIRONMENT=Development` (padrão do Compose) |
| Não consigo abrir chamado | O cliente não tem contrato Ativo e vigente (seção 6) |
