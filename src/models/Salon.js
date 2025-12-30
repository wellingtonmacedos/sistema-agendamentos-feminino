const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: String,
  address: String,
  logo: String, // URL
  workingHours: {
    type: Map,
    of: new mongoose.Schema({
      open: String, // "09:00"
      close: String, // "18:00"
      isOpen: Boolean,
      breaks: [{
        start: String, // "12:00"
        end: String    // "13:00"
      }]
    }),
    default: {}
  },
  settings: {
    slotInterval: { type: Number, default: 30 },
    appointmentBuffer: { type: Number, default: 0 }, // Minutes between appointments
    minNoticeMinutes: { type: Number, default: 60 }, // Minimum notice
    maxFutureDays: { type: Number, default: 30 },    // How far in future
  },
  chatConfig: {
    botBubbleColor: { type: String, default: '#F3F4F6' }, // Gray-100
    botTextColor: { type: String, default: '#1F2937' },   // Gray-800
    userBubbleColor: { type: String, default: '#3B82F6' }, // Blue-500
    userTextColor: { type: String, default: '#FFFFFF' },   // White
    buttonColor: { type: String, default: '#3B82F6' },     // Blue-500
    backgroundColor: { type: String, default: '#F9FAFB' }, // Gray-50
    headerColor: { type: String, default: '#FFFFFF' },     // White
    headerTextColor: { type: String, default: '#1F2937' }, // Gray-800
    assistantName: { type: String, default: 'Assistente' },
    assistantTone: { type: String, enum: ['formal', 'neutro', 'informal'], default: 'neutro' },
    avatarUrl: { type: String, default: '' },
    showAvatar: { type: Boolean, default: true },
  },
  cancellationPolicy: String,
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN'],
    default: 'ADMIN'
  },
  active: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Salon', salonSchema);
