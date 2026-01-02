const availabilityService = require('../services/availabilityService');
const appointmentService = require('../services/appointmentService');
const { sendAppointmentConfirmation } = require('../services/notificationService');

const { generateGoogleCalendarUrl, generateICSContent } = require('../utils/calendarUtils');

// Main Handler
const getAvailability = async (req, res) => {
  try {
    const { salao_id, data, profissional_id, servicos } = req.query;

    console.log(`[Availability Check] Salon: ${salao_id}, Date: ${data}, Prof: ${profissional_id}, Services: ${servicos}`);

    if (!salao_id || !data || !profissional_id || !servicos) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios: salao_id, data, profissional_id, servicos' });
    }

    // Use centralized logic from availabilityService
    // It returns objects { time, available: true }. We map to simple array of strings for API contract.
    const slots = await availabilityService.getAvailableSlots(
        salao_id, 
        data, 
        profissional_id, 
        Array.isArray(servicos) ? servicos : [servicos]
    );

    const horarios = slots.map(s => s.time);
    
    res.json(horarios);

  } catch (error) {
    if (error.name === 'ArrivalOrder') {
        // Return empty slots but with a special header to indicate Arrival Order mode
        res.set('x-arrival-order', 'true');
        return res.json([]);
    }
    console.error(error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { salao_id, profissional_id, data, hora_inicio, servicos, cliente, telefone, origin } = req.body;

    // Basic validation of presence
    if (!salao_id || !profissional_id || !data || !hora_inicio || !servicos || !cliente || !telefone) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios (incluindo telefone)' });
    }

    // Delegate business logic to Service
    const novoAgendamento = await appointmentService.createAppointment({
        salao_id,
        profissional_id,
        cliente,
        telefone,
        data,
        hora_inicio,
        servicos,
        origin
    });

    // Send Notification (Async, don't block response)
    sendAppointmentConfirmation(novoAgendamento).catch(console.error);

    // Prepare Calendar Links
    try {
        const Salon = require('../models/Salon');
        const salon = await Salon.findById(salao_id);
        const populatedAppointment = await require('../models/Appointment').findById(novoAgendamento._id)
            .populate('professionalId')
            .populate('services');

        if (salon && populatedAppointment) {
            const googleLink = generateGoogleCalendarUrl(populatedAppointment, salon);
            // Download link for ICS. Assuming API is hosted at relative path or we return absolute if env var set
            // For now, return a relative path that the frontend can prefix if needed, or just relative
            const icsLink = `/api/agendamentos/${novoAgendamento._id}/ics`;

            return res.json({ 
                sucesso: true, 
                links: {
                    google: googleLink,
                    ics: icsLink
                }
            });
        }
    } catch (calError) {
        console.error('Error generating calendar links:', calError);
        // Fallback to success without links if error occurs
    }

    res.json({ sucesso: true });

  } catch (error) {
    console.error(error);
    if (error.message === 'Horário indisponível') {
        return res.status(409).json({ erro: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

const getServices = async (req, res) => {
  try {
    const { salao_id } = req.query;
    if (!salao_id) {
        return res.status(400).json({ error: 'salao_id é obrigatório' });
    }
    const services = await appointmentService.getServices(salao_id);
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
};

const getSalons = async (req, res) => {
    try {
        // Just return minimal info for the selector, excluding SUPER_ADMIN
        const salons = await require('../models/Salon').find({
            role: { $ne: 'SUPER_ADMIN' }
        }, 'name _id phone chatConfig');
        res.json(salons);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar salões' });
    }
};

const getProfessionals = async (req, res) => {
    try {
        const { salao_id, service_id } = req.query;
        const query = { salonId: salao_id };
        
        if (service_id) {
            query.services = service_id;
        }
        
        const professionals = await require('../models/Professional').find(query);
        res.json(professionals);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar profissionais' });
    }
};

const getMyAppointments = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ error: 'Telefone é obrigatório' });
        }

        const cleanPhone = phone.replace(/\D/g, '');
        console.log(`Buscando agendamentos para telefone: ${phone} (Clean: ${cleanPhone})`);
        
        // Debug: Check ALL appointments in DB to see what exists
        const allAppts = await require('../models/Appointment').find({}, 'customerPhone date status');
        console.log("DEBUG - Todos agendamentos no banco:", JSON.stringify(allAppts, null, 2));

        // Fix: Field in Appointment model is 'customerPhone', not 'telefone'
        const appointments = await require('../models/Appointment').find({
            $or: [
                { customerPhone: phone },
                { customerPhone: cleanPhone }
            ],
            status: { $ne: 'completed' }, // Only active appointments
        })
        .populate('services', 'name price duration')
        .populate('professionalId', 'name')
        .populate('salonId', 'name phone')
        .sort({ date: 1, startTime: 1 });

        console.log(`Encontrados ${appointments.length} agendamentos.`);
        res.json(appointments);

    } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        res.status(500).json({ error: 'Erro ao buscar agendamentos' });
    }
};

const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { phone } = req.body; // Security check: must provide phone to cancel

        if (!phone) {
            return res.status(400).json({ error: 'Telefone é obrigatório para confirmação' });
        }

        const Appointment = require('../models/Appointment');
        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }

        // Verify ownership (compare clean phones)
        const cleanPhoneInput = phone.replace(/\D/g, '');
        const cleanPhoneStored = appointment.customerPhone ? appointment.customerPhone.replace(/\D/g, '') : '';
        
        if (cleanPhoneStored !== cleanPhoneInput) {
            console.log(`Cancel auth failed: Stored=${cleanPhoneStored} vs Input=${cleanPhoneInput}`);
            return res.status(403).json({ error: 'Não autorizado' });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ error: 'Não é possível cancelar um agendamento já realizado' });
        }

        await Appointment.findByIdAndDelete(id);
        
        // Ideally we should notify the professional/salon here.
        // But for now, just delete.
        
        res.json({ success: true, message: 'Agendamento cancelado com sucesso' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cancelar agendamento' });
    }
};

const getAllAppointments = async (req, res) => {
    try {
        // Filter by the logged-in admin's salon ID
        const filter = req.user ? { salonId: req.user.id } : {};
        
        const { start, end } = req.query;
        if (start && end) {
            filter.date = { 
                $gte: new Date(start), 
                $lte: new Date(end) 
            };
        }

        const limit = start && end ? 0 : 50; // No limit if range is specified

        const query = require('../models/Appointment')
            .find(filter)
            .populate('professionalId', 'name')
            .sort({ date: -1, startTime: 1 });
            
        if (limit > 0) {
            query.limit(limit);
        }

        const appointments = await query.exec();
            
        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar agendamentos' });
    }
};

const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // If status is changing to completed, set realEndTime
        if (updates.status === 'completed') {
            updates.realEndTime = new Date();
        }

        const appointment = await require('../models/Appointment').findByIdAndUpdate(
            id,
            updates,
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }

        res.json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar agendamento' });
    }
};

const checkCustomer = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Telefone é obrigatório' });
    }

    // Normalize phone (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    console.log(`Checking customer: Input="${phone}" Clean="${cleanPhone}"`);

    // Try finding by clean phone OR original phone (for backward compatibility)
    const customer = await require('../models/Customer').findOne({ 
        $or: [
            { phone: cleanPhone },
            { phone: phone }
        ]
    });
    
    if (customer) {
      console.log(`Customer found: ${customer.name}`);
      res.json({ found: true, name: customer.name });
    } else {
      console.log('Customer not found');
      res.json({ found: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao verificar cliente' });
  }
};

const downloadICS = async (req, res) => {
    try {
        const { id } = req.params;
        const Appointment = require('../models/Appointment');
        const Salon = require('../models/Salon');

        const appointment = await Appointment.findById(id).populate('services').populate('professionalId');
        if (!appointment) {
            return res.status(404).send('Agendamento não encontrado');
        }

        const salon = await Salon.findById(appointment.salonId);
        if (!salon) {
            return res.status(404).send('Estabelecimento não encontrado');
        }

        const icsContent = generateICSContent(appointment, salon);

        res.set('Content-Type', 'text/calendar');
        res.set('Content-Disposition', `attachment; filename=agendamento-${id}.ics`);
        res.send(icsContent);

    } catch (error) {
        console.error('Error downloading ICS:', error);
        res.status(500).send('Erro ao gerar arquivo de calendário');
    }
};

module.exports = {
  getAvailability,
  createAppointment,
  downloadICS, // Export new function
  getServices,
  getSalons,
  getProfessionals,
  getAllAppointments,
  updateAppointment,
  checkCustomer,
  getMyAppointments,
  cancelAppointment
};
