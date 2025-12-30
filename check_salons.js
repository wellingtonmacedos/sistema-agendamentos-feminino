const mongoose = require('mongoose');
const Salon = require('./src/models/Salon');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/agendamentos');
        console.log('Connected to DB');

        const salons = await Salon.find({}, 'name email role');
        console.log('Salons:', salons);
        require('fs').writeFileSync('salons_output.txt', JSON.stringify(salons, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
