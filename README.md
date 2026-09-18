# nassauTickets

Sistema Web para organizar o atendimento de um laboratório de análises clínicas por meio de senhas prioritárias (SP), gerais (SG) e de retirada de exames (SE).

## Objetivo

Aplicar os conceitos de React, organização de projetos, documentação e versionamento com Git/GitHub. Nesta primeira fase, o repositório contém a estrutura exigida, a documentação essencial e um protótipo funcional do totem de emissão de senhas.

## Tecnologias

- React 19
- Vite
- JavaScript, HTML e CSS
- Futuro backend: Node.js 22 com Express e MySQL 8.0

## Visão geral

```text
Cliente (totem React) --> API REST (planejada) --> MySQL
Atendente/Painel React --> API REST (planejada) --> MySQL
```

O protótipo atual executa somente no frontend e mantém os dados durante a sessão do navegador. A integração com API, autenticação, relatórios e persistência será realizada na segunda fase.

## Estrutura

```text
nassauTickets/
├── backend/
├── docs/
│   ├── branding/
│   ├── mer/
│   ├── mockups/
│   ├── models/uml/
│   └── requirements/
├── frontend/
├── .gitignore
├── LICENSE
└── README.md
```

## Instalação e execução

Requisitos: Node.js 22 LTS e npm.

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço informado pelo Vite no navegador. Não há variáveis de ambiente obrigatórias nesta fase.

Para validar a compilação de produção:

```bash
cd frontend
npm run build
```

## Branches

- `main`: versão estável e entregável.
- `dev`: desenvolvimento e integração das alterações.

O desenvolvimento é feito primeiro em `dev` e depois integrado a `main` por merge.

## Membros

| Nome | Matrícula | Papel |
| --- | --- | --- |
| Vinícius Ribau | 01794959 | Scrum Master, Documentador, Desenvolvedor e Testador |

## Escopo da fase 1

- Estrutura obrigatória do repositório e licença MIT.
- Documentação inicial de requisitos, regras de negócio, MER e UML.
- Protótipo React responsivo para emissão de senhas.
- Geração de numeração no padrão `YYMMDD-PPSQ`.
- Histórico Git com desenvolvimento em `dev` e merge em `main`.

Consulte [`docs/requirements/requisitos.md`](docs/requirements/requisitos.md) para o escopo funcional completo e o planejamento da segunda fase.
