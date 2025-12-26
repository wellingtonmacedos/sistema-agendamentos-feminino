const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  email: String,
  phone: String,
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  workingHours: {
    type: Map,
    of: new mongoose.Schema({
      open: String,
      close: String,
      isOpen: Boolean,
      breaks: [{
        start: String,
        end: String
      }]
    }),
    default: undefined 
  }
});

module.exports = mongoose.model('Professional', professionalSchema);
