const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
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
  dayOfWeek: {
    type: Number, // 0 (Sunday) - 6 (Saturday)
    required: true,
    min: 0,
    max: 6,
  },
  startTime: {
    type: String, // Format "HH:mm"
    required: true,
  },
  endTime: {
    type: String, // Format "HH:mm"
    required: true,
  },
  lunchStart: {
    type: String, // Format "HH:mm"
    default: null
  },
  lunchEnd: {
    type: String, // Format "HH:mm"
    default: null
  }
});

// Ensure one schedule per professional per day
scheduleSchema.index({ professionalId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
