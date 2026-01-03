const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  icon: {
    type: String, // Font Awesome class (e.g. "fa-solid fa-scissors")
    required: false,
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
});

module.exports = mongoose.model('Service', serviceSchema);
