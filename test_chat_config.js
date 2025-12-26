// const fetch = require('node-fetch'); // Native fetch in Node 18+

const BASE_URL = 'http://localhost:3000/api';

async function testChatConfig() {
    try {
        console.log('--- Testing Chat Config Sync ---');

        // 1. Login as Admin
        console.log('1. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@salao.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        
        if (!loginData.token) {
            throw new Error('Login failed: ' + JSON.stringify(loginData));
        }
        const token = loginData.token;
        console.log('Login successful.');

        // 2. Get Current Settings (via /me)
        console.log('2. Fetching /me ...');
        const meRes = await fetch(`${BASE_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meRes.json();
        
        if (!meData.chatConfig) {
            console.error('FAIL: chatConfig missing in /me response');
            console.log('Received:', meData);
        } else {
            console.log('SUCCESS: chatConfig found in /me');
        }

        // 3. Update Settings
        console.log('3. Updating Chat Config...');
        const newConfig = {
            botBubbleColor: '#FF0000', // Red
            assistantName: 'TestBot'
        };

        const updateRes = await fetch(`${BASE_URL}/salon`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatConfig: newConfig })
        });
        const updateData = await updateRes.json();
        
        // 4. Verify Update via /salons (Public)
        console.log('4. Verifying via Public /salons endpoint...');
        const publicRes = await fetch(`${BASE_URL}/salons`);
        const publicData = await publicRes.json();
        
        const mySalon = publicData.find(s => s._id === meData._id);
        
        if (mySalon && mySalon.chatConfig.botBubbleColor === '#FF0000') {
            console.log('SUCCESS: Public endpoint reflects changes.');
        } else {
            console.error('FAIL: Public endpoint does not show new color.');
            console.log('Expected #FF0000, got:', mySalon?.chatConfig?.botBubbleColor);
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
}

testChatConfig();
