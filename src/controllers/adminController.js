const Salon = require('../models/Salon');
const Professional = require('../models/Professional');
const Service = require('../models/Service');
const Schedule = require('../models/Schedule');
const Block = require('../models/Block');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

// --- Salon Settings ---

exports.updateSalon = async (req, res) => {
  try {
    const updates = req.body;
    // Prevent updating sensitive fields like password directly here (should have separate route)
    delete updates.password;
    delete updates.email; // Usually email change requires verification

    const salon = await Salon.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(salon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// --- Professionals Management ---

exports.createProfessional = async (req, res) => {
  try {
    const professional = new Professional({ ...req.body, salonId: req.user.id });
    await professional.save();
    res.status(201).json(professional);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findOneAndUpdate(
      { _id: id, salonId: req.user.id },
      req.body,
      { new: true }
    );
    if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });
    res.json(professional);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findOneAndDelete({ _id: id, salonId: req.user.id });
    if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });
    res.json({ message: 'Profissional removido' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// --- Services Management ---

exports.createService = async (req, res) => {
  try {
    const service = new Service({ ...req.body, salonId: req.user.id });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOneAndUpdate(
      { _id: id, salonId: req.user.id },
      req.body,
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOneAndDelete({ _id: id, salonId: req.user.id });
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json({ message: 'Serviço removido' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// --- Blocks Management ---

exports.createBlock = async (req, res) => {
    try {
        const { professionalId, startTime, endTime, reason } = req.body;
        // If professionalId is empty string or 'null', treat as undefined (global)
        const profId = (professionalId && professionalId !== 'null' && professionalId !== '') ? professionalId : undefined;

        const block = new Block({
            salonId: req.user.id,
            professionalId: profId,
            startTime,
            endTime,
            reason
        });
        await block.save();
        res.status(201).json(block);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getBlocks = async (req, res) => {
    try {
        const blocks = await Block.find({ salonId: req.user.id }).populate('professionalId', 'name');
        res.json(blocks);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const block = await Block.findOneAndDelete({ _id: id, salonId: req.user.id });
        if (!block) return res.status(404).json({ error: 'Bloqueio não encontrado' });
        res.json({ message: 'Bloqueio removido' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Reports ---

exports.getReports = async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        // Ensure endDate includes the whole day
        endDate.setHours(23, 59, 59, 999);

        console.log(`[Reports] Generating for Salon: ${req.user.id}`);
        console.log(`[Reports] Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const dateFilter = {
            salonId: new mongoose.Types.ObjectId(req.user.id),
            status: 'completed', // Only completed/finished appointments
            realEndTime: { $gte: startDate, $lte: endDate } // Filter by real end time
        };

        // Debug: Check matching documents count
        const count = await Appointment.countDocuments(dateFilter);
        console.log(`[Reports] Found ${count} completed appointments in range.`);

        // 1. Total Revenue & Appointments
        // Use finalPrice if available, otherwise fallback to totalPrice (though business rule says finalPrice is set on finish)
        const totalStats = await Appointment.aggregate([
            { $match: dateFilter },
            { 
                $group: { 
                    _id: null, 
                    totalRevenue: { $sum: { $ifNull: ["$finalPrice", "$totalPrice"] } },
                    totalAppointments: { $sum: 1 }
                } 
            }
        ]);
        
        console.log('[Reports] Total Stats:', totalStats);

        // 2. Revenue by Service
        const serviceStats = await Appointment.aggregate([
            { $match: dateFilter },
            { $unwind: "$services" },
            {
                $group: {
                    _id: "$services.name",
                    revenue: { $sum: "$services.price" }, // This is per-service price.
                    // Note: If finalPrice differs from totalPrice, distributing the difference to services is complex.
                    // For now, we stick to service list price revenue or pro-rated? 
                    // To keep it simple, reports by service track the *value of services performed*, 
                    // while totalRevenue tracks actual money in.
                    count: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // 3. Revenue by Professional
        const professionalStats = await Appointment.aggregate([
            { $match: dateFilter },
            {
                $lookup: {
                    from: "professionals",
                    localField: "professionalId",
                    foreignField: "_id",
                    as: "professional"
                }
            },
            { $unwind: "$professional" },
            {
                $group: {
                    _id: "$professional.name",
                    revenue: { $sum: { $ifNull: ["$finalPrice", "$totalPrice"] } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        res.json({
            total: totalStats[0] || { totalRevenue: 0, totalAppointments: 0 },
            byService: serviceStats,
            byProfessional: professionalStats
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar relatórios' });
    }
};

exports.finishAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { finalPrice } = req.body;
        
        console.log(`[Admin] Finishing appointment ${id}. Final Price Input: ${finalPrice}`);

        const appointment = await Appointment.findOne({ _id: id, salonId: req.user.id });
        
        if (!appointment) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        
        appointment.status = 'completed';
        appointment.realEndTime = new Date();
        if (finalPrice !== undefined) {
            appointment.finalPrice = Number(finalPrice);
        } else {
            appointment.finalPrice = appointment.totalPrice;
        }
        
        await appointment.save();
        console.log(`[Admin] Appointment finished. Status: ${appointment.status}, Final Price: ${appointment.finalPrice}`);
        res.json(appointment);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao finalizar atendimento' });
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Admin] Deleting appointment ${id} for user ${req.user.id}`);

        const appointment = await Appointment.findOne({ _id: id, salonId: req.user.id });
        
        if (!appointment) {
            console.log(`[Admin] Appointment ${id} not found or not owned by salon ${req.user.id}`);
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }

        await Appointment.findByIdAndDelete(id);
        console.log(`[Admin] Appointment ${id} deleted successfully`);
        res.json({ message: 'Agendamento excluído com sucesso' });
    } catch (error) {
        console.error(`[Admin] Error deleting appointment:`, error);
        res.status(500).json({ error: 'Erro ao excluir agendamento: ' + error.message });
    }
};
