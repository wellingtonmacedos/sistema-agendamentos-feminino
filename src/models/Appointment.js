const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // Optional for backward compatibility or migration, but logic will enforce it
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  date: {
    type: Date, // Just the date part, or full date
    required: true,
  },
  startTime: {
    type: Date, // Full ISO date with time
    required: true,
  },
  endTime: {
    type: Date, // Full ISO date with time
    required: true,
  },
  services: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    duration: Number
  }],
  totalPrice: Number,
  finalPrice: Number, // Price effectively paid/charged
  origin: {
    type: String,
    enum: ['client', 'panel'],
    default: 'client'
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  realEndTime: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Index for faster queries on overlap checks
appointmentSchema.index({ professionalId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
