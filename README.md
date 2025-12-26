# Sistema de Agendamentos SaaS - Backend API

API REST desenvolvida em Node.js com Express e MongoDB para gerenciamento de agendamentos multi-tenant.

## Pré-requisitos

- Node.js (v18+)
- MongoDB (Local ou Atlas)

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente no arquivo `.env`

## Execução

```bash
# Modo de desenvolvimento
npm run dev

# Produção
npm start
```

## Estrutura do Projeto

- `src/models`: Schemas do Mongoose (Salão, Profissional, Serviço, Agendamento, Horário)
- `src/services`: Lógica de negócios complexa (Cálculo de disponibilidade)
- `src/controllers`: Manipulação das requisições HTTP
- `src/routes`: Definição das rotas da API
- `src/utils`: Funções auxiliares (Data/Hora)

## Endpoints Principais

### Disponibilidade
`GET /api/disponibilidade/horarios`
- Query Params: `salonId`, `date` (YYYY-MM-DD), `professionalId`, `serviceIds` (pode ser array)
- Retorna: Lista de horários livres.

### Agendamentos
`POST /api/agendamentos`
- Body: `{ salonId, professionalId, customerName, date, startTime, serviceIds }`
- Cria um agendamento com validação estrita de conflitos.

## Lógica de Validação

O sistema garante integridade através de validação em duas camadas:
1. **Cálculo de Slots**: Filtra horários ocupados ao consultar disponibilidade.
2. **Validação Atômica/Double-Check**: Antes de salvar um agendamento, verifica novamente se existe colisão no banco de dados para prevenir condições de corrida (Race Conditions).
