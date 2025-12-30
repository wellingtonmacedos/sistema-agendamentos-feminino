const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

const run = async () => {
    try {
        console.log('Attempting login with default credentials...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@salao.com',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // Get Current User Info
        const meRes = await axios.get(`${baseURL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('\n--- Current User (Me) ---');
        console.log(`Name: ${meRes.data.name}`);
        console.log(`Email: ${meRes.data.email}`);
        console.log(`Role: ${meRes.data.role}`);
        console.log(`ID: ${meRes.data.id}`);

        // If Super Admin, list all users
        if (meRes.data.role === 'SUPER_ADMIN') {
            console.log('\n--- Fetching All Users (Super Admin) ---');
            try {
                const usersRes = await axios.get(`${baseURL}/super-admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(JSON.stringify(usersRes.data, null, 2));
            } catch (e) {
                console.log('Error fetching users:', e.message);
            }
        } else {
            // If just Admin, list what we can (Public Salons)
            console.log('\n--- Fetching Public Salons ---');
            const salonsRes = await axios.get(`${baseURL}/salons`);
            console.log(JSON.stringify(salonsRes.data, null, 2));
        }

    } catch (err) {
        console.error('Login failed or API error:', err.response ? err.response.data : err.message);
        
        // Try to register a temp admin to see if we can get in (if DB is empty/reset)
        // But seeder should have run.
    }
};

run();
