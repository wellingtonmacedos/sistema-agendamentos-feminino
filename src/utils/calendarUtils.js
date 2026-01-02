const { format } = require('date-fns');

/**
 * Generates a Google Calendar URL
 * @param {Object} appointment - The appointment object (populated)
 * @param {Object} salon - The salon object
 * @returns {string} URL
 */
const generateGoogleCalendarUrl = (appointment, salon) => {
    // Format: YYYYMMDDTHHmmssZ (UTC) or YYYYMMDDTHHmmss (Local if no Z)
    // Google expects dates in UTC ideally, or we specify ctz (timezone)
    // For simplicity, we'll format as simple YYYYMMDDTHHmmss and assume user's browser handles it or pass generic
    
    // date-fns format 'yyyyMMdd'T'HHmmss'
    // We need to handle Timezones carefully. The system seems to run on local time conceptualization.
    // Let's assume the dates in DB are correct JS Dates.
    
    const start = format(new Date(appointment.startTime), "yyyyMMdd'T'HHmmss");
    const end = format(new Date(appointment.endTime), "yyyyMMdd'T'HHmmss");
    
    const serviceNames = appointment.services.map(s => s.name).join(', ');
    const title = encodeURIComponent(`Agendamento: ${serviceNames}`);
    const details = encodeURIComponent(`Agendamento confirmado em ${salon.name}.\nProfissional: ${appointment.professionalId?.name || 'Não informado'}\nServiços: ${serviceNames}`);
    const location = encodeURIComponent(salon.address || salon.name); // Use address if available

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}&sf=true&output=xml`;
};

/**
 * Generates ICS content string
 * @param {Object} appointment - The appointment object (populated)
 * @param {Object} salon - The salon object
 * @returns {string} ICS content
 */
const generateICSContent = (appointment, salon) => {
    const start = format(new Date(appointment.startTime), "yyyyMMdd'T'HHmmss");
    const end = format(new Date(appointment.endTime), "yyyyMMdd'T'HHmmss");
    
    const serviceNames = appointment.services.map(s => s.name).join(', ');
    const description = `Agendamento confirmado em ${salon.name}.\\nProfissional: ${appointment.professionalId?.name || 'Não informado'}\\nServiços: ${serviceNames}`;
    const location = salon.address || salon.name;

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Agendamento System//BETA//PT_BR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:Agendamento: ${serviceNames}
UID:${appointment._id}@agendamento.system
SEQUENCE:0
STATUS:CONFIRMED
TRANSP:OPAQUE
DTSTART:${start}
DTEND:${end}
LOCATION:${location}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;
};

module.exports = {
    generateGoogleCalendarUrl,
    generateICSContent
};
