const mongoose = require('mongoose');
const Customer = require('../src/models/Customer');
const connectDB = require('../src/config/db');
require('dotenv').config();

const checkLastCustomers = async () => {
    await connectDB();
    try {
        const customers = await Customer.find().sort({ createdAt: -1 }).limit(5);
        console.log('--- Últimos Clientes ---');
        console.log(customers);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

checkLastCustomers();