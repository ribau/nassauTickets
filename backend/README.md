# Backend do nassauTickets

API em Node.js 22.13 ou superior. Para iniciar a versão em desenvolvimento:

```bash
cd backend
npm start
```

A API escuta em `127.0.0.1:3001` e cria automaticamente o arquivo SQLite `nassautickets.sqlite` no diretório atual. O caminho pode ser alterado pela variável `DB_PATH`. O primeiro acesso no frontend permite cadastrar o gestor; a senha é armazenada com scrypt. Os testes das regras de fila podem ser executados com `npm test`.

Esta implementação utiliza `node:sqlite`, recurso experimental do Node.js 22. SQLite é uma alternativa local de implantação simples à infraestrutura MySQL sugerida na especificação. O arquivo `database/schema.sql` contém uma proposta de esquema MySQL, ainda não integrada à API. Migração, configuração para acesso em rede, recuperação e implantação segura permanecem como trabalho futuro.
