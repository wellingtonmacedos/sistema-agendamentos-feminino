const axios = require('axios');
const { format, addDays } = require('date-fns');

const baseURL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('--- TEST ARRIVAL ORDER ---');
        
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@salao.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        // Get Salon Info to get IDs
        const meRes = await axios.get(`${baseURL}/me`, { headers });
        const salonId = meRes.data.id;
        
        // Get a service
        const srvRes = await axios.get(`${baseURL}/services?salao_id=${salonId}`);
        if (srvRes.data.length === 0) throw new Error('No services found');
        const serviceId = srvRes.data[0]._id;
        
        // Get a professional
        const profRes = await axios.get(`${baseURL}/professionals?salao_id=${salonId}`);
        const professionalId = profRes.data[0]?._id; // Might be null if none, but availability usually needs one or handles it

        // 2. Create Arrival Order Block for Tomorrow
        const tomorrow = addDays(new Date(), 1);
        const dateStr = format(tomorrow, 'yyyy-MM-dd');
        
        const start = new Date(tomorrow);
        start.setHours(0, 0, 0, 0);
        const end = new Date(tomorrow);
        end.setHours(23, 59, 59, 999);
        
        console.log(`2. Creating Arrival Order for ${dateStr}...`);
        const blockRes = await axios.post(`${baseURL}/blocks`, {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            reason: 'Test Arrival Order',
            type: 'ARRIVAL_ORDER'
        }, { headers });
        
        const blockId = blockRes.data._id;
        console.log('Block created:', blockId);

        // 3. Check Availability
        console.log('3. Checking Availability...');
        try {
            const availRes = await axios.get(`${baseURL}/disponibilidade/horarios`, {
                params: {
                    salao_id: salonId,
                    data: dateStr,
                    servicos: serviceId,
                    profissional_id: professionalId
                }
            });
            console.log('Response Headers:', availRes.headers);
            console.log('x-arrival-order header:', availRes.headers['x-arrival-order']);
            
            if (availRes.headers['x-arrival-order'] === 'true') {
                console.log('SUCCESS: Arrival Order header received.');
            } else {
                console.error('FAILURE: Arrival Order header MISSING.');
            }
            
        } catch (err) {
            if (err.response) {
                 console.log('Response Headers (Error):', err.response.headers);
                 if (err.response.headers['x-arrival-order'] === 'true') {
                     console.log('SUCCESS: Arrival Order header received (in error response).');
                 } else {
                     console.log('Error Response:', err.response.data);
                 }
            } else {
                console.error('Error checking availability:', err.message);
            }
        }

        // 4. Cleanup
        console.log('4. Cleaning up block...');
        await axios.delete(`${baseURL}/blocks/${blockId}`, { headers });
        console.log('Block deleted.');

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

run();
