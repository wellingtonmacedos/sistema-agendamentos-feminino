const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

const checkRole = async () => {
    try {
        console.log('Attempting login as Super Admin...');
        const res = await axios.post(`${baseURL}/auth/login`, {
            email: 'super@sistema.com',
            password: 'super123'
        });

        console.log('Login Response Status:', res.status);
        console.log('User Object:', res.data.salon);
        console.log('Role:', res.data.salon.role);
        
        if (res.data.salon.role === 'SUPER_ADMIN') {
            console.log('SUCCESS: Role is SUPER_ADMIN');
        } else {
            console.log('FAILURE: Role is NOT SUPER_ADMIN');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

checkRole();
