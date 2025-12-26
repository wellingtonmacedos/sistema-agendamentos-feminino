# Plano de Desenvolvimento - SaaS de Agendamentos (Multi-tenant)

## Visão Geral da Arquitetura

*   **Modelo:** SaaS Multi-tenant (Separação Lógica via `salonId`).
*   **Backend (Fonte da Verdade):** Node.js + Express + MongoDB. Responsável por TODA a lógica de negócios, cálculos de horário e validações.
*   **Frontend (Admin):** Painel para donos de salão e profissionais (React/Next.js).
*   **Interface do Cliente:** Link de agendamento web e/ou Chatbot (WhatsApp/Instagram).
*   **Papel da IA:** Interface de Linguagem Natural.
    *   **Entrada:** "Tem horário pro João amanhã à tarde?"
    *   **Processamento:** Extrai intenção e parâmetros -> Consulta API (`GET /disponibilidade`).
    *   **Saída:** Recebe JSON do backend e gera texto amigável.
    *   **Regra de Ouro:** A IA NUNCA calcula datas ou disponibilidade. Ela apenas consulta o Backend.

---

## FASE 1: MVP Funcional (Alicerce)
**Objetivo:** Validar a tecnologia e o fluxo principal de agendamento (Happy Path).

### Módulos
1.  **Core Database & Multi-tenancy:**
    *   Estrutura de dados base (Salons, Professionals, Services).
    *   Garantia que todo dado pertence a um `salonId`.
2.  **Engine de Disponibilidade (O Coração):**
    *   Algoritmo que cruza Agenda x Bloqueios x Agendamentos x Duração do Serviço.
    *   *Status:* Parcialmente implementado (`availabilityService.js`).
3.  **API de Agendamento (Transacional):**
    *   Validação Dupla (Check-then-Act).
    *   Prevenção de Overbooking.
4.  **Interface de Teste (Frontend Básico):**
    *   Formulário simples para simular o fluxo.

### Ordem de Implementação
1.  [x] Configuração do Servidor e Conexão DB.
2.  [x] Models Mongoose (Multi-tenant ready).
3.  [x] Lógica de "Gerar Horários Disponíveis" (Algoritmo puro).
4.  [x] Endpoints de Disponibilidade e Criação de Agendamento.
5.  [x] **Autenticação Básica (JWT):** Proteger rotas administrativas.
6.  [x] **Gestão de Horários:** CRUD para definir horário de funcionamento do profissional.
7.  [x] **Setup de Notificações:** Esqueleto do serviço criado.

---

## FASE 2: Versão Comercial (Produto Vendável)
**Objetivo:** Transformar o sistema em um produto que salões pagariam para usar.

### Módulos
1.  **Módulo de Notificações:**
    *   Envio de lembretes (Email/WhatsApp) 24h e 1h antes.
    *   Reduz "No-Show".
2.  **Painel Administrativo (Dashboard):**
    *   Agenda visual (Drag & Drop).
    *   Gestão de Profissionais e Serviços.
3.  **Gestão de Clientes (Mini-CRM):**
    *   Histórico de agendamentos.
    *   Dados de contato.
4.  **Integração com IA (Básica):**
    *   Webhook para receber mensagens de texto.
    *   Parser de intenção simples.

### Ordem de Implementação
1.  Dashboard Visual (Para o dono do salão ver a agenda).
2.  Sistema de Notificações (Worker em background).
3.  CRUD completo de Gestão (Serviços/Profissionais) via UI.

---

## FASE 3: Versão Escalável & IA Avançada
**Objetivo:** Escalar para milhares de salões e oferecer automação inteligente.

### Módulos
1.  **Pagamentos (Fintech):**
    *   Integração Stripe/MercadoPago.
    *   Cobrança de sinal (depósito) para reservar.
    *   Split de pagamento (Parte pro salão, parte pro profissional).
2.  **Performance & Caching:**
    *   Redis para cache de disponibilidade (endpoints pesados).
    *   Filas (BullMQ) para notificações e tarefas pesadas.
3.  **IA Chatbot Avançado:**
    *   Contexto de conversa.
    *   Negociação de horários complexos (sempre consultando API).
    *   Voice-to-Text para áudios no WhatsApp.

### Ordem de Implementação
1.  Otimização de Banco de Dados (Índices compostos).
2.  Integração de Pagamentos.
3.  Camada de Cache.
4.  Agente de IA Completo.
