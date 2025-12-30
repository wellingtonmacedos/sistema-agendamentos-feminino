const mongoose = require('mongoose');
const fs = require('fs');
const Salon = require('./src/models/Salon');

const run = async () => {
    console.log('Starting script...');
    try {
        console.log('Connecting to DB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/agendamentos', { serverSelectionTimeoutMS: 2000 });
        console.log('Connected to DB');

        const users = await Salon.find({}, 'name email role phone active');
        console.log('Found users:', users.length);
        
        fs.writeFileSync('users_output.json', JSON.stringify(users, null, 2));
        console.log('File written.');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

run();
