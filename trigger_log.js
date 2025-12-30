const axios = require('axios');
const baseURL = 'http://localhost:3000/api';

const run = async () => {
    try {
        await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@salao.com',
            password: 'wrongpassword'
        });
    } catch (err) {
        console.log('Expected error:', err.response?.data?.error);
    }
};

run();
