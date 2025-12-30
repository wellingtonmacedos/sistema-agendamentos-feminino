const axios = require('axios');
const baseURL = 'http://localhost:3000/api';
const SUPER_ADMIN_EMAIL = 'super@sistema.com';
const SUPER_ADMIN_PASS = 'super123';

const run = async () => {
    try {
        console.log('1. Login Super Admin');
        const superLogin = await axios.post(`${baseURL}/auth/login`, {
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASS
        });
        const superToken = superLogin.data.token;

        console.log('2. Find Admin admin@salao.com');
        const adminsRes = await axios.get(`${baseURL}/super-admin/users`, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        const targetAdmin = adminsRes.data.find(a => a.email === 'admin@salao.com');
        if (!targetAdmin) throw new Error('Admin not found');
        
        console.log('3. Reset Password to "nova123"');
        await axios.post(`${baseURL}/super-admin/users/${targetAdmin._id}/reset-password`, {
            newPassword: 'nova123'
        }, {
            headers: { Authorization: `Bearer ${superToken}` }
        });

        console.log('4. Login with "nova123"');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@salao.com',
            password: 'nova123'
        });
        console.log('SUCCESS:', loginRes.data.message);

    } catch (err) {
        console.error('FAILED:', err.response ? err.response.data : err.message);
    }
};

run();
