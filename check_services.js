const mongoose = require('mongoose');
const Service = require('./src/models/Service');
const connectDB = require('./src/config/db');
require('dotenv').config();

const run = async () => {
    await connectDB();
    const services = await Service.find({});
    console.log(JSON.stringify(services, null, 2));
    process.exit();
};

run();