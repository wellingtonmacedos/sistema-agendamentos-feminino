export const chatMessages = {
    welcome: "Oie! Sou a **{name}** ✨. Como posso te deixar mais linda hoje? 💖",
    welcome_back: "Olá novamente, **{name}**! Que alegria te ver por aqui ✨",
    ask_name: "Certo. Como é a primeira vez, me diz seu **Nome Completo**? 🌸",
    nice_to_meet: "Prazer, {name}! Adorei seu nome 💕",
    no_salon: "Poxa, não encontrei nenhum estabelecimento disponível agora. 😔",
    error_loading_salons: "Tive um probleminha para carregar os locais. Tenta recarregar a página? 🔄",
    select_salon: "Selecione o estabelecimento: ✨",
    select_service: "Que tudo! 💅 Qual procedimento vamos fazer hoje?",
    error_loading_services: "Ops, não consegui carregar os serviços. 😥",
    ask_professional: "Tem alguma profissional preferida para te atender? 🌟",
    no_professionals_service: "Poxa, não temos profissionais disponíveis para esse serviço agora. 😕",
    error_loading_professionals: "Erro ao buscar as profissionais. 😥",
    any_professional: "Sem preferência (Qualquer fada disponível 🧚‍♀️)",
    ask_date: "Entendi! Para qual dia você gostaria de agendar? 🗓️",
    checking_schedule: "Só um momentinho, estou vendo os horários livres... 💖",
    arrival_order_warning: "Neste dia, o atendimento é por ordem de chegada, tá bom? ✨",
    ask_another_date: "Prefere escolher outra data?",
    found_slots: "Olha só! Encontrei estes horários para {date}: ✨",
    no_slots: "Poxa, não tenho horários livres para {date}. Vamos tentar outro dia? 🗓️",
    error_checking_schedule: "Tive um erro ao buscar os horários. 😔",
    confirm_data: "Perfeito! Confere se está tudo certinho: ✨",
    confirm_button: "Confirmar Agendamento ✅",
    success_title: "Agendamento Confirmado! 🎉",
    success_details: "{service} com {professional}\nDia {date} às {time}. Vai ficar incrível! 💅",
    error_finalizing: "Ocorreu um erro ao finalizar. Tente novamente, por favor. 😥",
    my_appointments_empty: "Você não tem agendamentos ativos no momento.",
    my_appointments_found: "Encontrei {count} agendamento(s) ativo(s) para você ✨",
    cancel_success: "Agendamento cancelado com sucesso. Espero te ver em breve! ✨",
    cancel_error: "Erro ao cancelar agendamento. 😥",
    identify_first: "Por favor, me diz seu telefone primeiro para eu achar seus agendamentos. 📱",
    ask_phone_init: "Antes de começarmos, por favor, me informe seu **número de celular** (com DDD). 📱",
    yes_another_date: "Sim, escolher outra data",
    no_end_chat: "Não, encerrar por aqui",
    end_chat_message: "Entendido. Qualquer coisa é só chamar! Beijos! 😘"
};

export const formatMessage = (key, params = {}) => {
    let msg = chatMessages[key] || key;
    Object.keys(params).forEach(param => {
        msg = msg.replace(`{${param}}`, params[param]);
    });
    return msg;
};
