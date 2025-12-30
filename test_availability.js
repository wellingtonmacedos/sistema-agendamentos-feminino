const axios = require('axios');
const mongoose = require('mongoose');

// Connect to MongoDB directly to get IDs
mongoose.connect('mongodb://localhost:27017/sistema_agendamentos')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const Salon = require('./src/models/Salon');
const Professional = require('./src/models/Professional');
const Service = require('./src/models/Service');

async function test() {
    try {
        // 1. Get first salon
        const salon = await Salon.findOne({ active: true });
        if (!salon) throw new Error('No active salon found');
        console.log('Salon ID:', salon._id);

        // 2. Get first professional for this salon
        const professional = await Professional.findOne({ salonId: salon._id });
        if (!professional) throw new Error('No professional found for this salon');
        console.log('Professional ID:', professional._id);

        // 3. Get first service for this salon
        const service = await Service.findOne({ salonId: salon._id });
        if (!service) throw new Error('No service found for this salon');
        console.log('Service ID:', service._id);

        // 4. Test Availability API
        const baseURL = 'http://localhost:3000/api';
        const date = new Date().toISOString().split('T')[0]; // Today
        
        console.log(`Testing availability for date: ${date}`);

        try {
            const res = await axios.get(`${baseURL}/disponibilidade/horarios`, {
                params: {
                    salao_id: salon._id.toString(),
                    data: date,
                    profissional_id: professional._id.toString(),
                    servicos: service._id.toString()
                }
            });
            console.log('Available Slots:', res.data);
        } catch (apiError) {
            console.error('API Error:', apiError.response ? apiError.response.data : apiError.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

test();
