const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Public: Availability & Booking
router.get('/disponibilidade/horarios', appointmentController.getAvailability);
router.post('/agendamentos', appointmentController.createAppointment);
router.get('/services', appointmentController.getServices);
router.get('/salons', appointmentController.getSalons);
router.get('/professionals', appointmentController.getProfessionals);
router.get('/customers/check', appointmentController.checkCustomer);
router.get('/my-appointments', appointmentController.getMyAppointments);
router.delete('/my-appointments/:id', appointmentController.cancelAppointment);

// Protected: Admin / Management Routes

router.get('/admin/customers', authMiddleware, customerController.getCustomers);
router.post('/admin/customers', authMiddleware, customerController.createCustomer);
router.put('/admin/customers/:id', authMiddleware, customerController.updateCustomer);

router.put('/salon', authMiddleware, adminController.updateSalon);
router.get('/admin/reports', authMiddleware, reportController.getBillingReports);
router.put('/appointments/:id/finish', authMiddleware, adminController.finishAppointment);
router.put('/appointments/:id', authMiddleware, appointmentController.updateAppointment); // General update

router.post('/professionals', authMiddleware, adminController.createProfessional);
router.put('/professionals/:id', authMiddleware, adminController.updateProfessional);
router.delete('/professionals/:id', authMiddleware, adminController.deleteProfessional);

router.post('/services', authMiddleware, adminController.createService);
router.put('/services/:id', authMiddleware, adminController.updateService);
router.delete('/services/:id', authMiddleware, adminController.deleteService);

// Blocks CRUD
router.post('/blocks', authMiddleware, adminController.createBlock);
router.get('/blocks', authMiddleware, adminController.getBlocks);
router.delete('/blocks/:id', authMiddleware, adminController.deleteBlock);

// Helper route to get salon info (protected)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const salon = await require('../models/Salon').findById(req.user.id);
        if (!salon) return res.status(404).json({ error: 'Salão não encontrado' });
        res.json(salon);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do salão' });
    }
});

router.get('/admin/appointments', authMiddleware, appointmentController.getAllAppointments);
router.delete('/admin/appointments/:id', authMiddleware, adminController.deleteAppointment);

module.exports = router;
