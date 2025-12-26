const BASE_URL = 'http://localhost:3000/api';

async function run() {
    try {
        console.log('--- STARTING TEST FLOW ---');
        
        // 1. Login
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@salao.com', password: 'admin123' })
        });
        const token = (await loginRes.json()).token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        console.log('1. Logged in.');

        // Get Salon ID
        const meRes = await fetch(`${BASE_URL}/me`, { headers });
        const me = await meRes.json();
        const salao_id = me.id;
        console.log('Salon ID:', salao_id);

        // 2. Create Customer
        const customerRes = await fetch(`${BASE_URL}/admin/customers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Test User', phone: '11999999999' })
        });
        
        let customer;
        if (customerRes.status === 400) {
            // Probably already exists
            const existing = await fetch(`${BASE_URL}/admin/customers?search=11999999999`, { headers });
            const data = await existing.json();
            customer = data.customers[0];
            console.log('2. Customer already exists:', customer._id);
        } else if (!customerRes.ok) {
            console.log('Customer creation failed:', await customerRes.text());
            return;
        } else {
            customer = await customerRes.json();
            console.log('2. Customer created:', customer._id);
        }

        // 3. Create Appointment
        const servicesRes = await fetch(`${BASE_URL}/services?salao_id=${salao_id}`, { headers });
        const services = await servicesRes.json();
        if (!services.length) throw new Error('No services found');
        const serviceId = services[0]._id;

        const prosRes = await fetch(`${BASE_URL}/professionals?salao_id=${salao_id}`, { headers });
        const professionals = await prosRes.json();
        if (!professionals.length) throw new Error('No professionals found');
        const professionalId = professionals[0]._id;

        const appointmentPayload = {
            salao_id: salao_id,
            cliente: 'Test User',
            telefone: '11999999999',
            servicos: [serviceId],
            profissional_id: professionalId,
            data: new Date().toISOString().split('T')[0], // Today
            hora_inicio: '14:00',
            origin: 'panel'
        };
        console.log('Creating appointment with:', appointmentPayload);

        const aptRes = await fetch(`${BASE_URL}/agendamentos`, {
            method: 'POST',
            headers,
            body: JSON.stringify(appointmentPayload)
        });
        
        if (!aptRes.ok) {
            console.log('Appointment creation failed:', await aptRes.text());
            return;
        }

        // createAppointment returns { sucesso: true }
        // It does NOT return the ID.
        // I need to find the appointment I just created.
        console.log('3. Appointment created successfully.');

        // Fetch appointments to find the new one
        const allAptsRes = await fetch(`${BASE_URL}/admin/appointments`, { headers });
        const allApts = await allAptsRes.json();
        const appointment = allApts.find(a => a.customerPhone === '11999999999' && a.status !== 'completed');
        
        if (!appointment) {
            console.log('Could not find created appointment.');
            return;
        }
        console.log('Found appointment:', appointment._id, appointment.totalPrice);

        // 4. Finish Appointment
        const finishRes = await fetch(`${BASE_URL}/appointments/${appointment._id}/finish`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ finalPrice: 150 }) // Override price
        });
        
        if (!finishRes.ok) {
            console.log('Finish failed:', await finishRes.text());
            return;
        }

        const finishedApt = await finishRes.json();
        console.log('4. Appointment finished. Status:', finishedApt.status, 'FinalPrice:', finishedApt.finalPrice);

        // 5. Check Reports
        const reportRes = await fetch(`${BASE_URL}/reports`, { headers });
        const reportData = await reportRes.json();
        console.log('5. Reports:', JSON.stringify(reportData.total, null, 2));

        if (reportData.total.totalRevenue === 150) {
            console.log('SUCCESS: Revenue matches final price.');
        } else {
            console.log('FAILURE: Revenue mismatch.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
