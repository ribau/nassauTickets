# Requisitos iniciais

Este documento resume a especificação fornecida. Os itens marcados como **Fase 1** já possuem protótipo no frontend; os demais compõem a próxima fase.

## Requisitos funcionais

| ID | Requisito | Entrega |
| --- | --- | --- |
| RF01 | Emitir senhas SP, SG e SE com sequência diária por tipo. | Fase 1 |
| RF02 | Formatar a senha como `YYMMDD-PPSQ`. | Fase 1 |
| RF03 | Manter filas separadas e selecionar a próxima senha conforme prioridade. | Fase 2 |
| RF04 | Permitir chamar, chamar novamente, iniciar e finalizar atendimento. | Fase 2 |
| RF05 | Exibir no painel as cinco últimas senhas chamadas, sem antecipar a próxima. | Fase 2 |
| RF06 | Marcar como não compareceu após duas chamadas sem atendimento. | Fase 2 |
| RF07 | Descartar senhas pendentes após as 17h e concluir atendimentos iniciados. | Fase 2 |
| RF08 | Autenticar atendentes e oferecer perfil adicional de gestor. | Fase 2 |
| RF09 | Emitir relatórios diário, mensal, detalhado, de tempo médio e auditoria. | Fase 2 |
| RF10 | Registrar atendente, guichê e horários de cada etapa do atendimento. | Fase 2 |

## Regras de negócio

- **RN01:** o expediente para chamadas ocorre das 7h às 17h.
- **RN02:** a alternância básica é `[SP] -> [SE|SG] -> [SP] -> [SE|SG]`.
- **RN03:** quando disponível após uma SP, a SE precede a SG; filas vazias não impedem o avanço.
- **RN04:** qualquer guichê pode atender qualquer tipo de senha.
- **RN05:** a sequência possui três dígitos, é independente por tipo e reinicia diariamente.
- **RN06:** a senha transita por EMITIDA, AGUARDANDO, CHAMADA, CHAMADA_NOVAMENTE, EM_ATENDIMENTO e ATENDIDA, podendo terminar em NÃO_COMPARECEU.
- **RN07:** o painel mostra apenas as cinco últimas senhas efetivamente chamadas.
- **RN08:** duas solicitações simultâneas de atendentes não podem reservar a mesma senha.

## Requisitos não funcionais

- **RNF01 - Segurança:** senhas de acesso devem ser armazenadas com hash e o acesso aos relatórios deve ser autorizado por perfil.
- **RNF02 - Privacidade/LGPD:** coletar somente dados necessários e definir retenção para registros e auditoria.
- **RNF03 - Acessibilidade:** interface navegável por teclado, com contraste adequado, foco visível e rótulos para leitores de tela.
- **RNF04 - Concorrência:** a seleção da próxima senha deve ser atômica no backend.
- **RNF05 - Disponibilidade:** frontend e painel devem informar indisponibilidade da API sem exibir dados incorretos.
- **RNF06 - Auditoria:** eventos de chamada e atendimento devem ser rastreáveis e não editáveis pelo atendente.
- **RNF07 - Desempenho:** operações comuns devem responder em até dois segundos em condições normais.

## Critérios de aceite da fase 1

1. O projeto instala e executa a partir de `frontend/`.
2. O usuário escolhe um tipo e recebe uma senha no padrão definido.
3. A sequência aumenta de forma independente para SP, SG e SE durante a sessão.
4. O layout funciona em telas pequenas e grandes.
5. A estrutura, documentação, branches e histórico seguem o documento da atividade.

