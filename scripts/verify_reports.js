const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const reportController = require('../src/controllers/reportController');
const Appointment = require('../src/models/Appointment');
const Professional = require('../src/models/Professional');
const Salon = require('../src/models/Salon');

const mockRes = () => {
    const res = {};
    res.statusCode = 200;
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
    console.log("Starting Report Verification...");
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

        // Completed Appointment
        await Appointment.create({
            salonId: salon._id,
            professionalId: professional._id,
            customerName: 'Client 1',
            customerPhone: '11999999999',
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(),
            services: [{ name: 'Corte', price: 50 }],
            totalPrice: 50,
            finalPrice: 50,
            status: 'completed',
            realEndTime: new Date()
        });

        // Another Completed Appointment
        await Appointment.create({
            salonId: salon._id,
            professionalId: professional._id,
            customerName: 'Client 2',
            customerPhone: '11999999999',
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(),
            services: [{ name: 'Barba', price: 30 }],
            totalPrice: 30,
            finalPrice: 30,
            status: 'completed',
            realEndTime: new Date()
        });

        // Cancelled Appointment (Should be ignored)
        await Appointment.create({
            salonId: salon._id,
            professionalId: professional._id,
            customerName: 'Client 3',
            customerPhone: '11999999999',
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(),
            services: [{ name: 'Corte', price: 50 }],
            totalPrice: 50,
            status: 'cancelled'
        });

        // 2. Test Report Generation
        let req = {
            query: { period: 'month' },
            user: { id: salon._id }
        };
        let res = mockRes();

        await reportController.getBillingReports(req, res);
        
        const data = res.data;
        console.log('Summary:', data.summary);
        console.log('By Professional:', data.byProfessional);
        console.log('By Service:', data.byService);

        // Validations
        const totalRevenueOk = data.summary.totalRevenue === 80;
        const totalCountOk = data.summary.totalAppointments === 2;
        const serviceCountOk = data.byService.find(s => s.name === 'Corte').count === 1;

        console.log('Validation Total Revenue:', totalRevenueOk ? 'PASS' : 'FAIL');
        console.log('Validation Total Count:', totalCountOk ? 'PASS' : 'FAIL');
        console.log('Validation Service Count:', serviceCountOk ? 'PASS' : 'FAIL');

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
        if (mongoServer) await mongoServer.stop();
    }
}

run();
