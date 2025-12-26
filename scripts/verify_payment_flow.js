const mongoose = require('mongoose');
const Appointment = require('../src/models/Appointment');
const Salon = require('../src/models/Salon');
const Professional = require('../src/models/Professional');
const adminController = require('../src/controllers/adminController');

const { MongoMemoryServer } = require('mongodb-memory-server');

const mockRes = () => {
    const res = {};
    res.statusCode = 200; // default
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function run() {
    console.log("Starting Verification Script...");
    let mongoServer;
    try {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
        console.log('Connected to In-Memory DB');

        // 1. Setup Data
        const salon = await Salon.create({ 
            name: 'Test Salon', 
            email: `test${Date.now()}@test.com`, 
            password: '123', 
            phone: '123' 
        });
        
        const professional = await Professional.create({
            salonId: salon._id,
            name: 'Pro Test',
            services: []
        });

        const appointment = await Appointment.create({
            salonId: salon._id,
            professionalId: professional._id,
            customerName: 'Client Test',
            customerPhone: '11999999999',
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(),
            services: [],
            totalPrice: 100,
            status: 'confirmed'
        });

        console.log('Created Appointment:', appointment._id);

        // 2. Test Missing Payment Method
        let req = {
            params: { id: appointment._id },
            body: { finalPrice: 100 },
            user: { id: salon._id }
        };
        let res = mockRes();

        await adminController.finishAppointment(req, res);
        console.log('Test Missing Payment Method:', res.statusCode === 400 ? 'PASS' : 'FAIL', res.data);

        // 3. Test Invalid Payment Method
        req.body.paymentMethod = 'bitcoin';
        res = mockRes();
        await adminController.finishAppointment(req, res);
        console.log('Test Invalid Payment Method:', res.statusCode === 400 ? 'PASS' : 'FAIL', res.data);

        // 4. Test Valid Payment Method
        req.body.paymentMethod = 'credit_card';
        res = mockRes();
        await adminController.finishAppointment(req, res);
        console.log('Test Valid Payment Method:', res.data.status === 'completed' ? 'PASS' : 'FAIL', res.data);

        // 5. Verify Persistence
        const updatedAppt = await Appointment.findById(appointment._id);
        console.log('Verify Persistence:', updatedAppt.paymentMethod === 'credit_card' ? 'PASS' : 'FAIL');

        // Cleanup
        await Appointment.deleteMany({ _id: appointment._id });
        await Professional.deleteMany({ _id: professional._id });
        await Salon.deleteMany({ _id: salon._id });

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
