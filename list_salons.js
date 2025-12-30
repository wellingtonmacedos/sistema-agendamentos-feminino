const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sistema_agendamentos', {
    serverSelectionTimeoutMS: 5000
})
.then(async () => {
    console.log('Connected');
    try {
        const Salon = require('./src/models/Salon');
        const salons = await Salon.find({}, 'email name _id');
        console.log('Salons:', salons);
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
})
.catch(err => console.error('Connection error:', err));
