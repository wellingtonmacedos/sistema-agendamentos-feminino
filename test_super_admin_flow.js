const axios = require('axios');

const baseURL = 'http://localhost:3000/api';
const SUPER_ADMIN_EMAIL = 'super@sistema.com';
const SUPER_ADMIN_PASS = 'super123';
const ADMIN_EMAIL = 'admin@salao.com';
const ADMIN_PASS = 'admin123';

const run = async () => {
    try {
        console.log('--- 1. Login as Super Admin ---');
        const superLogin = await axios.post(`${baseURL}/auth/login`, {
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASS
        });
        const superToken = superLogin.data.token;
        console.log('Super Admin Logged in.');

        console.log('\n--- 2. List Admins ---');
        const adminsRes = await axios.get(`${baseURL}/super-admin/users`, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log(`Found ${adminsRes.data.length} admins.`);

        console.log('\n--- 3. Create New Admin ---');
        const newAdminData = {
            name: 'New Test Salon',
            email: `testadmin_${Date.now()}@test.com`,
            password: 'password123',
            phone: '11999999999'
        };
        const createRes = await axios.post(`${baseURL}/super-admin/users`, newAdminData, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        const newAdminId = createRes.data.admin._id;
        console.log('Created Admin ID:', newAdminId);

        console.log('\n--- 4. Update Admin ---');
        await axios.put(`${baseURL}/super-admin/users/${newAdminId}`, {
            name: 'Updated Test Salon',
            active: false
        }, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log('Admin updated (Name & Active status).');

        console.log('\n--- 5. Reset Password ---');
        await axios.post(`${baseURL}/super-admin/users/${newAdminId}/reset-password`, {
            newPassword: 'newpassword123'
        }, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log('Password reset.');

        console.log('\n--- 6. Verify Deactivation ---');
        // Try to login with new admin
        try {
            await axios.post(`${baseURL}/auth/login`, {
                email: newAdminData.email,
                password: 'newpassword123'
            });
            console.error('ERROR: Should not be able to login (Account is inactive).');
        } catch (err) {
            console.log('Correctly rejected login for inactive account:', err.response?.data?.error);
        }

        console.log('\n--- 7. Delete Admin ---');
        await axios.delete(`${baseURL}/super-admin/users/${newAdminId}`, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log('Admin deleted.');

        console.log('\n--- 8. Security Check: Access as Normal Admin ---');
        const adminLogin = await axios.post(`${baseURL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        const adminToken = adminLogin.data.token;
        
        try {
            await axios.get(`${baseURL}/super-admin/users`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.error('ERROR: Normal Admin should NOT access Super Admin routes.');
        } catch (err) {
            console.log('Correctly rejected Normal Admin:', err.response?.status, err.response?.data?.error);
        }

        console.log('\n--- 9. Audit Logs ---');
        const logsRes = await axios.get(`${baseURL}/super-admin/audit-logs`, {
            headers: { Authorization: `Bearer ${superToken}` }
        });
        console.log(`Retrieved ${logsRes.data.length} audit logs.`);
        console.log('Last log action:', logsRes.data[0]?.action);

        console.log('\nSUCCESS: All Super Admin flows verified.');

    } catch (err) {
        console.error('TEST FAILED:', err.response ? err.response.data : err.message);
    }
};

run();
