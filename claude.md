# Projeto: Solução Tecnológica Corporativa Integrada - JAKE Tecnologia (PIM IV)

## 1. Contexto do Projeto
Você está atuando como Engenheiro de Software Sênior para desenvolver uma solução tecnológica para a JAKE Tecnologia, uma prestadora de serviços de TI. O sistema tem como objetivo gerenciar contratos e automatizar a abertura e o acompanhamento de chamados técnicos.

## 2. Stack Tecnológico Obrigatório
- **Back-end:** C# com ASP.NET Core (API RESTful).
- **Banco de Dados:** Relacional (SQL Server ou PostgreSQL) e complemento NoSQL (se necessário para logs/anexos).
- **Front-end Web:** SPA (React, Angular ou Vue.js) responsivo.
- **Front-end Mobile:** Framework híbrido (React Native ou Flutter).
- **Infraestrutura:** Docker (Containers).
- **Autenticação:** JWT (JSON Web Token).

## 3. Arquitetura de Software (Padrão em Camadas)
O back-end deve ser estritamente estruturado nas seguintes camadas:
1. **Presentation Layer (API):** Controllers, roteamento e injeção de dependências.
2. **Service Layer (Business Rules):** Regras de negócio, validações, processamento. Não deve acessar o banco diretamente.
3. **Repository / Data Access Layer:** Comunicação exclusiva com o banco de dados (Padrão Repository).
4. **Domain / Models:** Entidades do banco, DTOs, Enums.

*Regra de Ouro:* A API e o App Mobile consumirão estritamente os mesmos endpoints REST.

## 4. Estrutura do Banco de Dados
O banco de dados deve conter, no mínimo, as seguintes entidades:
- **Usuário / Perfil:** Clientes, Funcionários e Gerentes.
- **LogAcesso:** Registro de logins e ações.
- **Contrato (CTO):** Especializado em Sistema (SI), Suporte (SP) e Cloud Security (CS). Deve conter data de início, data_fim e status.
- **Chamado:** Relacionado a um Contrato e a um Usuário (Cliente).

**Requisitos de Banco de Dados (Procedures e Triggers):**
- Criar uma Stored Procedure chamada `sp_AbrirChamado`.
- A Procedure deve validar se o contrato informado está ATIVO e dentro da vigência (`data_fim >= GETDATE()`) ANTES de inserir na tabela CHAMADO.

## 5. Regras de Negócio e Funcionalidades Chave
- **Autenticação:** O token JWT deve conter informações de identificação e do Perfil do usuário.
- **Painel do Gerente (Web):** Acesso a CRUD de contratos, listagem de todos os chamados e indicadores gerenciais.
- **Mobile (Offline-first básico):** Deve prever cache local para consultas recentes e tratar perda de conexão.
- **Validação de Chamado:** A regra de validar a vigência do contrato deve estar tanto na camada de *Service* (C#) quanto garantida no banco de dados (`sp_AbrirChamado`).

## 6. Plano de Execução (Sprints)
Siga este roteiro passo a passo ao desenvolver:

* **Sprint 1:** Configuração inicial, Dockerfile, Modelagem do Banco, API de Autenticação (JWT) e CRUD de Contratos.
* **Sprint 2:** Implementação do módulo de Chamados (incluindo a SP `sp_AbrirChamado`), Painel do Gerente e Frontend Web básico.
* **Sprint 3:** Adaptação/criação de rotas específicas para o Mobile e estrutura inicial do App.
* **Sprint 4:** Geração de relatórios, finalização do Docker-compose e documentação.

## 7. Instruções Comportamentais para o Claude Code
- Ao gerar código, sempre crie os arquivos nas pastas corretas seguindo a arquitetura em camadas.
- Adicione comentários explicando regras de negócio complexas.
- Sempre que criar uma entidade de banco de dados, gere a respectiva *Migration* (se usar Entity Framework) ou o script SQL.
- Foque primeiro em deixar o Back-end (C# API) robusto antes de focar nos detalhes visuais do Front-end.