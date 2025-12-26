const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: false, // If null, applies to entire salon (all professionals)
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  reason: String,
});

blockSchema.index({ professionalId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Block', blockSchema);
