const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const { authMiddleware, checkRole } = require('../middlewares/authMiddleware');
const userManagementController = require('../controllers/userManagementController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/services');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas!'));
  }
});

// Upload Route
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  console.log('[API] Upload request received');
  if (!req.file) {
    console.log('[API] No file received');
    return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  }
  console.log('[API] File received:', req.file.filename);
  const relativePath = `/public/uploads/services/${req.file.filename}`;
  console.log('[API] Returning path:', relativePath);
  res.json({ path: relativePath });
});

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
router.get('/agendamentos/:id/ics', appointmentController.downloadICS);

// Protected: Admin / Management Routes

router.get('/admin/customers', authMiddleware, customerController.getCustomers);
router.post('/admin/customers', authMiddleware, customerController.createCustomer);
router.put('/admin/customers/:id', authMiddleware, customerController.updateCustomer);
router.delete('/admin/customers/:id', authMiddleware, customerController.deleteCustomer);

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
        
        // Return safe data
        res.json({
            id: salon._id,
            name: salon.name,
            email: salon.email,
            role: salon.role,
            workingHours: salon.workingHours,
            settings: salon.settings,
            chatConfig: salon.chatConfig // Include chatConfig
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do salão' });
    }
});

// Public: Get Chat Config (from first available salon or default)
router.get('/public/config', async (req, res) => {
    try {
        const Salon = require('../models/Salon');
        // Get the first active salon (excluding SUPER_ADMIN)
        const salon = await Salon.findOne({ 
            active: true, 
            deletedAt: null,
            role: { $ne: 'SUPER_ADMIN' }
        });
        
        if (salon && salon.chatConfig) {
            res.json(salon.chatConfig);
        } else {
            // Default config if no salon or no config
            res.json({}); 
        }
    } catch (error) {
        console.error("Error fetching public config:", error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
});


router.get('/admin/appointments', authMiddleware, appointmentController.getAllAppointments);
router.delete('/admin/appointments/:id', authMiddleware, adminController.deleteAppointment);

// Super Admin Routes
router.get('/super-admin/users', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.listAdmins);
router.post('/super-admin/users', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.createAdmin);
router.put('/super-admin/users/:id', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.updateAdmin);
router.delete('/super-admin/users/:id', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.deleteAdmin);
router.post('/super-admin/users/:id/reset-password', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.resetPassword);
router.get('/super-admin/audit-logs', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.getAuditLogs);

module.exports = router;
