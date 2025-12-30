const axios = require('axios');

const baseURL = 'http://localhost:3000/api';
const SUPER_ADMIN_EMAIL = 'super@sistema.com';
const SUPER_ADMIN_PASS = 'super123';

const run = async () => {
    try {
        console.log('--- 1. Login as Super Admin ---');
        const superLogin = await axios.post(`${baseURL}/auth/login`, {
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASS
        });
        const superToken = superLogin.data.token;
        console.log('Super Admin Logged in.');

        const tempEmail = `reset_test_${Date.now()}@test.com`;
        const tempPass = 'pass123';
        const newPass = 'newpass123';

        console.log('\n--- 2. Create New Admin ---');
        const createRes = await axios.post(`${baseURL}/super-admin/users`, {
            name: 'Reset Test Salon',
            email: tempEmail,
            password: tempPass,
            phone: '11999999999'
        }, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        const adminId = createRes.data.admin._id;
        console.log('Created Admin ID:', adminId);

        console.log('\n--- 3. Login with Original Password ---');
        await axios.post(`${baseURL}/auth/login`, {
            email: tempEmail,
            password: tempPass
        });
        console.log('Login successful with original password.');

        console.log('\n--- 4. Reset Password ---');
        await axios.post(`${baseURL}/super-admin/users/${adminId}/reset-password`, {
            newPassword: newPass
        }, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log('Password reset API called.');

        console.log('\n--- 5. Login with OLD Password (Expect Fail) ---');
        try {
            await axios.post(`${baseURL}/auth/login`, {
                email: tempEmail,
                password: tempPass
            });
            console.error('ERROR: Login should have failed!');
        } catch (err) {
            console.log('Correctly rejected old password:', err.response?.data?.error);
        }

        console.log('\n--- 6. Login with NEW Password (Expect Success) ---');
        try {
            const loginRes = await axios.post(`${baseURL}/auth/login`, {
                email: tempEmail,
                password: newPass
            });
            console.log('Login SUCCESS with NEW password!');
            console.log('Token received:', loginRes.data.token ? 'Yes' : 'No');
        } catch (err) {
            console.error('ERROR: Login failed with new password:', err.response?.data?.error);
        }

        // Cleanup
        console.log('\n--- Cleanup ---');
        await axios.delete(`${baseURL}/super-admin/users/${adminId}`, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log('Test Admin deleted.');

    } catch (err) {
        console.error('TEST FAILED:', err.response ? err.response.data : err.message);
    }
};

run();
