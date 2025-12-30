const Salon = require('../models/Salon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const existingSalon = await Salon.findOne({ email });
    if (existingSalon) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newSalon = new Salon({
      name,
      email,
      password: hashedPassword,
      phone
    });

    await newSalon.save();

    // Generate Token
    const token = jwt.sign(
      { id: newSalon._id, email: newSalon.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Salão cadastrado com sucesso',
      token,
      salon: {
        id: newSalon._id,
        name: newSalon.name,
        email: newSalon.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao registrar salão' });
  }
};

const login = async (req, res) => {
  try {
    const { password } = req.body;
    let { email } = req.body;

    // Normalize email
    if (email) email = email.trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const salon = await Salon.findOne({ email });
    if (!salon) {
      console.log(`Login failed: Email ${email} not found.`);
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    if (!salon.active) {
      console.log(`Login failed: Account ${email} is inactive.`);
      return res.status(403).json({ error: 'Conta desativada. Contate o administrador.' });
    }

    if (salon.deletedAt) {
      console.log(`Login failed: Account ${email} is deleted.`);
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, salon.password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for ${email}.`);
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: salon._id, email: salon.email, role: salon.role || 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      salon: {
        id: salon._id,
        name: salon.name,
        email: salon.email,
        role: salon.role || 'ADMIN'
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao realizar login' });
  }
};

module.exports = {
  register,
  login
};
