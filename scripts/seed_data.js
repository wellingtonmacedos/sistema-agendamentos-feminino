const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Salon = require('../src/models/Salon');
const Professional = require('../src/models/Professional');
const Service = require('../src/models/Service');
const Schedule = require('../src/models/Schedule');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await Salon.deleteMany({});
    await Professional.deleteMany({});
    await Service.deleteMany({});
    await Schedule.deleteMany({});
    console.log('Data cleared');

    // 1. Create Salon
    const salon = await Salon.create({
      name: 'Salão Teste',
      email: 'teste@salao.com',
      password: 'password123', // In production, this should be hashed
      phone: '11999999999'
    });
    console.log('Salon created:', salon._id);

    // 2. Create Professional
    const professional = await Professional.create({
      salonId: salon._id,
      name: 'João Cabeleireiro',
      email: 'joao@salao.com',
      phone: '11988888888'
    });
    console.log('Professional created:', professional._id);

    // 3. Create Service
    const service = await Service.create({
      salonId: salon._id,
      name: 'Corte Masculino',
      duration: 30, // minutes
      price: 50.00
    });
    console.log('Service created:', service._id);

    // 4. Create Schedule (Mon-Fri)
    // Create for next 7 days logic? No, schedule is day of week based.
    // Let's create for Monday (1) through Friday (5)
    const schedules = [];
    for (let i = 1; i <= 5; i++) {
      schedules.push({
        salonId: salon._id,
        professionalId: professional._id,
        dayOfWeek: i,
        startTime: '09:00',
        endTime: '18:00',
        lunchStart: '12:00',
        lunchEnd: '13:00'
      });
    }
    await Schedule.insertMany(schedules);
    console.log('Schedules created');

    console.log('--- SEED DATA COMPLETE ---');
    console.log(`Salon ID: ${salon._id}`);
    console.log(`Professional ID: ${professional._id}`);
    console.log(`Service ID: ${service._id}`);
    
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
