const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing Admin Login...');
        const res = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@salao.com',
            password: 'admin123'
        });
        
        console.log('Login Status:', res.status);
        console.log('Login Response:', res.data);

    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused! Is the server running on port 3000?');
        }
    }
}

testLogin();
