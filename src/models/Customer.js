const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastAppointment: {
    type: Date,
    default: null
  }
});

// Ensure unique phone per salon
customerSchema.index({ salonId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
