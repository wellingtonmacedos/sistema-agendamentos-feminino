const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database Connection
connectDB().then(() => {
    // Seed admin user (useful for in-memory or fresh setups)
    require('./utils/seeder')();
});

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('API de Agendamentos is running...');
});

const PORT = process.env.PORT || 3000;

console.log('Attempting to start server on port', PORT);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
