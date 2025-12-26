const BASE_URL = 'http://localhost:3000/api';

async function run() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@salao.com',
                password: 'admin123'
            })
        });
        
        if (!loginRes.ok) throw new Error('Login failed');
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Logged in. Token acquired.');

        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Get Appointments
        console.log('Fetching appointments...');
        const aptRes = await fetch(`${BASE_URL}/admin/appointments`, { headers });
        const appointments = await aptRes.json();
        console.log(`Found ${appointments.length} appointments.`);
        appointments.forEach(apt => {
            console.log(`- ID: ${apt._id}`);
            console.log(`  Date: ${apt.date} (Local: ${new Date(apt.date).toLocaleString()})`);
            console.log(`  Status: ${apt.status}`);
            console.log(`  TotalPrice: ${apt.totalPrice}`);
            console.log(`  FinalPrice: ${apt.finalPrice}`);
            console.log(`  SalonId: ${apt.salonId}`);
        });

        // 3. Get Reports
        console.log('Fetching reports...');
        const reportRes = await fetch(`${BASE_URL}/reports`, { headers });
        const reportData = await reportRes.json();
        console.log('Reports Data:', JSON.stringify(reportData, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
