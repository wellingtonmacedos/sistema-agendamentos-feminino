require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Salon = require('../src/models/Salon');
const connectDB = require('../src/config/db');

const createAdmin = async () => {
    await connectDB();

    const email = 'admin@salao.com';
    const password = 'admin123';
    const name = 'Salão Premium Admin';
    const phone = '11999999999';

    try {
        let salon = await Salon.findOne({ email });

        if (salon) {
            console.log('--- Usuário Admin já existe ---');
            console.log('Email:', email);
            console.log('Senha: (a mesma que foi criada anteriormente)');
            // Optionally update password here if needed
            const salt = await bcrypt.genSalt(10);
            salon.password = await bcrypt.hash(password, salt);
            await salon.save();
            console.log('Senha resetada para:', password);
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            salon = new Salon({
                name,
                email,
                password: hashedPassword,
                phone
            });

            await salon.save();
            console.log('--- Usuário Admin Criado com Sucesso ---');
            console.log('Email:', email);
            console.log('Senha:', password);
        }

    } catch (err) {
        console.error('Erro ao criar admin:', err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

createAdmin();
