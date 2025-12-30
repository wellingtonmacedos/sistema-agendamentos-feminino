const axios = require('axios');

async function test() {
    const baseURL = 'http://localhost:3000/api';
    
    try {
        // 1. Get Salons (Public)
        console.log('Fetching salons...');
        const salonsRes = await axios.get(`${baseURL}/salons`);
        if (salonsRes.data.length === 0) throw new Error('No salons found');
        const salonId = salonsRes.data[0]._id;
        console.log('Salon ID:', salonId);

        // 2. Get Professionals
        const profRes = await axios.get(`${baseURL}/professionals`, {
            params: { salao_id: salonId }
        });
        if (profRes.data.length === 0) throw new Error('No professionals found');
        const professionalId = profRes.data[0]._id;
        console.log('Professional ID:', professionalId);

        // 3. Get Services
        const servRes = await axios.get(`${baseURL}/services`, {
            params: { salao_id: salonId }
        });
        if (servRes.data.length === 0) throw new Error('No services found');
        const serviceId = servRes.data[0]._id;
        console.log('Service ID:', serviceId);

        // 4. Test Availability
        const date = new Date().toISOString().split('T')[0];
        console.log(`Testing availability for date: ${date}`);

        const availRes = await axios.get(`${baseURL}/disponibilidade/horarios`, {
            params: {
                salao_id: salonId,
                data: date,
                profissional_id: professionalId,
                servicos: serviceId
            }
        });
        console.log('Available Slots:', availRes.data);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

test();
