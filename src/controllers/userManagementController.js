const Salon = require('../models/Salon');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

// Helper para Log
const logAction = async (action, performedBy, target, details, ip) => {
    try {
        await AuditLog.create({
            action,
            performedBy,
            targetId: target._id,
            targetName: target.name,
            details,
            ipAddress: ip
        });
    } catch (e) {
        console.error('Falha ao gravar log de auditoria:', e);
    }
};

const listAdmins = async (req, res) => {
    try {
        // Lista ADMINs (role='ADMIN' ou sem role definido) e que não foram excluídos
        // Exclui explicitamente SUPER_ADMIN para evitar listar a si mesmo
        const query = {
            $and: [
                {
                    $or: [
                        { role: 'ADMIN' },
                        { role: { $exists: false } },
                        { role: null }
                    ]
                },
                { role: { $ne: 'SUPER_ADMIN' } },
                { deletedAt: null }
            ]
        };

        const admins = await Salon.find(query).select('-password');
        
        console.log(`[SuperAdmin] Listando administradores: ${admins.length} encontrados.`);
        
        res.json(admins);
    } catch (error) {
        console.error('Erro ao listar administradores:', error);
        res.status(500).json({ error: 'Erro ao listar administradores' });
    }
};

const createAdmin = async (req, res) => {
    try {
        let { name, email, password, phone } = req.body;

        if (email) email = email.trim();

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
        }

        if (await Salon.findOne({ email })) {
            return res.status(400).json({ error: 'Email já em uso' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new Salon({
            name,
            email,
            password: hashedPassword,
            phone,
            role: 'ADMIN',
            active: true
        });

        await newAdmin.save();

        await logAction('CREATE_ADMIN', req.user.id, newAdmin, { email }, req.ip);

        res.status(201).json({ message: 'Administrador criado com sucesso', admin: newAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar administrador' });
    }
};

const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        let { name, email, active, phone } = req.body;
        
        if (email) email = email.trim();

        const admin = await Salon.findById(id);
        if (!admin || admin.role !== 'ADMIN') {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }

        const oldData = { name: admin.name, email: admin.email, active: admin.active };
        
        if (email && email !== admin.email) {
             if (await Salon.findOne({ email })) {
                return res.status(400).json({ error: 'Email já em uso' });
            }
        }

        admin.name = name || admin.name;
        admin.email = email || admin.email;
        admin.phone = phone || admin.phone;
        if (typeof active === 'boolean') admin.active = active;

        await admin.save();

        await logAction('UPDATE_ADMIN', req.user.id, admin, { oldData, newData: req.body }, req.ip);

        res.json({ message: 'Administrador atualizado', admin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar' });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await Salon.findById(id);
        
        if (!admin || admin.role !== 'ADMIN') {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }

        admin.deletedAt = new Date();
        admin.active = false; // Deactivate as well
        await admin.save();

        await logAction('DELETE_ADMIN', req.user.id, admin, {}, req.ip);

        res.json({ message: 'Administrador removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        const admin = await Salon.findById(id);
        if (!admin || admin.role !== 'ADMIN') {
             return res.status(404).json({ error: 'Administrador não encontrado' });
        }

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        await logAction('RESET_PASSWORD', req.user.id, admin, {}, req.ip);

        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate('performedBy', 'name email')
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
};

module.exports = {
    listAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    resetPassword,
    getAuditLogs
};