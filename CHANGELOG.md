# Changelog

## [1.1.0] - 2025-12-26

### Adicionado
- **Relatórios de Faturamento**:
  - Nova aba "Relatórios" no painel administrativo.
  - Filtros por período (Dia, Semana, Mês, Ano).
  - Cards de resumo: Faturamento Total, Atendimentos, Ticket Médio.
  - Gráficos de receita por Profissional e por Serviço.
  - Baseado em agendamentos finalizados (`completed`) e data real de encerramento (`realEndTime`).

- **Agenda Visual (Calendário)**:
  - Substituição da lista de agendamentos por calendário interativo (`react-big-calendar`).
  - Visualizações Mensal, Semanal e Diária.
  - Criação de agendamentos clicando nos horários (slot selection).
  - Visualização de detalhes, exclusão e finalização de agendamentos diretamente no calendário.

- **Melhorias no Chatbot**:
  - Remoção da etapa de seleção de estabelecimento para fluxo mais fluido.
  - Correção da duplicação da mensagem de boas-vindas.
  - Seleção automática de salão e aplicação de branding imediata.
  - Identificação automática de clientes recorrentes.

- **Backend**:
  - Novo campo `realEndTime` no modelo `Appointment`.
  - Novo controlador `reportController.js` para agregações financeiras.
  - Rotas de API para relatórios e atualização de agendamentos.

### Corrigido
- Filtro de profissionais por serviço.
- Sincronização de configurações de chat (cores, avatar) entre admin e frontend.
- Exibição de avatar nas mensagens do bot.
