const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

const testListAdmins = async () => {
    try {
        console.log('1. Autenticando como Super Admin...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'super@sistema.com',
            password: 'super123'
        });

        const token = loginRes.data.token;
        console.log('Login OK. Token obtido.');

        console.log('2. Listando administradores...');
        const listRes = await axios.get(`${baseURL}/super-admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Status: ${listRes.status}`);
        console.log(`Administradores encontrados: ${listRes.data.length}`);
        
        if (listRes.data.length > 0) {
            console.log('Lista de Admins:', listRes.data.map(a => ({ 
                id: a._id, 
                name: a.name, 
                email: a.email, 
                role: a.role 
            })));
            console.log('SUCESSO: Administradores listados.');
        } else {
            console.log('AVISO: Lista vazia. Verifique se existem admins no banco.');
            // O seeder deve criar pelo menos um admin@salao.com
        }

    } catch (error) {
        console.error('ERRO:', error.response ? error.response.data : error.message);
    }
};

testListAdmins();
