const axios = require('axios');

async function testChatSync() {
    const baseURL = 'http://localhost:3000/api';
    let token = '';

    try {
        console.log('1. Login Admin...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@salao.com',
            password: 'admin123'
        });
        token = loginRes.data.token;
        console.log('Login OK.');

        console.log('2. Updating Chat Config...');
        const newConfig = {
            assistantName: 'Teste Bot ' + Date.now(),
            buttonColor: '#FF0000'
        };
        
        const updateRes = await axios.put(`${baseURL}/salon`, 
            { chatConfig: newConfig },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Update OK. New Name:', updateRes.data.chatConfig.assistantName);

        console.log('3. Checking Public Config...');
        const publicRes = await axios.get(`${baseURL}/public/config`);
        
        console.log('Public Config Assistant Name:', publicRes.data.assistantName);
        console.log('Public Config Button Color:', publicRes.data.buttonColor);

        if (publicRes.data.assistantName === newConfig.assistantName) {
            console.log('SUCCESS: Public config matches updated config!');
        } else {
            console.error('FAILURE: Public config does not match!');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testChatSync();
