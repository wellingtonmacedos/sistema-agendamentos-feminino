const Appointment = require('../models/Appointment');
const Professional = require('../models/Professional');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } = require('date-fns');

const getBillingReports = async (req, res) => {
    try {
        const { period, date } = req.query; // period: 'day', 'week', 'month', 'year'. date: reference date (ISO)
        const salonId = req.user.id;

        if (!salonId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        let startDate, endDate;
        const refDate = date ? parseISO(date) : new Date();

        switch (period) {
            case 'day':
                startDate = startOfDay(refDate);
                endDate = endOfDay(refDate);
                break;
            case 'week':
                startDate = startOfWeek(refDate, { weekStartsOn: 0 }); // Sunday start
                endDate = endOfWeek(refDate, { weekStartsOn: 0 });
                break;
            case 'month':
                startDate = startOfMonth(refDate);
                endDate = endOfMonth(refDate);
                break;
            case 'year':
                startDate = startOfYear(refDate);
                endDate = endOfYear(refDate);
                break;
            default:
                // Default to month if not specified
                startDate = startOfMonth(refDate);
                endDate = endOfMonth(refDate);
        }

        // Query criteria
        // "Considerar exclusivamente agendamentos com status FINALIZADO"
        // "Basear o faturamento na data de encerramento do atendimento (fim_real)"
        const query = {
            salonId: salonId,
            status: 'completed',
            realEndTime: { $gte: startDate, $lte: endDate }
        };

        const appointments = await Appointment.find(query).populate('professionalId', 'name');

        // Calculations
        let totalRevenue = 0;
        let totalAppointments = appointments.length;
        const revenueByProfessional = {};
        const revenueByService = {};

        appointments.forEach(app => {
            const price = app.finalPrice || app.totalPrice || 0;
            totalRevenue += price;

            // By Professional
            const profName = app.professionalId ? app.professionalId.name : 'Desconhecido';
            if (!revenueByProfessional[profName]) {
                revenueByProfessional[profName] = { revenue: 0, count: 0 };
            }
            revenueByProfessional[profName].revenue += price;
            revenueByProfessional[profName].count += 1;

            // By Service
            if (app.services && app.services.length > 0) {
                app.services.forEach(svc => {
                    const svcPrice = svc.price || 0;
                    if (!revenueByService[svc.name]) {
                        revenueByService[svc.name] = { revenue: 0, count: 0 };
                    }
                    revenueByService[svc.name].revenue += svcPrice;
                    revenueByService[svc.name].count += 1;
                });
            }
        });

        const averageTicket = totalAppointments > 0 ? (totalRevenue / totalAppointments) : 0;

        res.json({
            period,
            startDate,
            endDate,
            summary: {
                totalRevenue,
                totalAppointments,
                averageTicket
            },
            byProfessional: Object.entries(revenueByProfessional).map(([name, data]) => ({ name, value: data.revenue, count: data.count })),
            byService: Object.entries(revenueByService).map(([name, data]) => ({ name, value: data.revenue, count: data.count }))
        });

    } catch (error) {
        console.error("Erro no relatório:", error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
};

module.exports = {
    getBillingReports
};
