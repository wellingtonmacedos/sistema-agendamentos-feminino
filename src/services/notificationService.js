// Notification Service Skeleton
// This service handles sending communications to customers (Email, WhatsApp, SMS)

// In the future, we will integrate with providers like:
// - Email: AWS SES, SendGrid, or Nodemailer
// - WhatsApp: Twilio, WPPConnect, or Meta API

const sendEmail = async (to, subject, text) => {
    // Placeholder for email sending logic
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject} | Body: ${text}`);
    return true;
};

const sendWhatsApp = async (phone, message) => {
    // Placeholder for WhatsApp sending logic
    console.log(`[WHATSAPP MOCK] To: ${phone} | Message: ${message}`);
    return true;
};

const sendAppointmentConfirmation = async (appointment) => {
    try {
        const { customerName, date, startTime, salonId } = appointment;
        
        // Format date and time for friendly display
        const dateStr = new Date(date).toLocaleDateString('pt-BR');
        const timeStr = new Date(startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const message = `Olá ${customerName}, seu agendamento foi confirmado para dia ${dateStr} às ${timeStr}.`;

        // Assuming we have customer email/phone. For now, we log.
        // In a real scenario, we would look up the customer's contact info.
        // Since our Appointment model currently stores 'customerName' as a string (simple MVP),
        // we might not have the email/phone directly unless we expand the model.
        
        // TODO: Expand Appointment model to include customerPhone/customerEmail or link to a Customer model.
        
        console.log(`[NOTIFICAÇÃO] Enviando confirmação para ${customerName}...`);
        await sendWhatsApp('5511999999999', message); // Mock phone
        
        return true;
    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        return false;
    }
};

module.exports = {
    sendAppointmentConfirmation,
    sendWhatsApp,
    sendEmail
};
