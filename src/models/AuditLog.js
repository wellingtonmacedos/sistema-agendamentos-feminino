const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true,
    enum: ['CREATE_ADMIN', 'UPDATE_ADMIN', 'DELETE_ADMIN', 'RESET_PASSWORD', 'TOGGLE_STATUS'] 
  },
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salon', 
    required: true 
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Salon' 
  },
  targetName: String, // Snapshot do nome para facilitar leitura
  details: { type: Object }, // Dados alterados ou metadados
  ipAddress: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);