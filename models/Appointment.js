const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  salesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesman', required: true },

  buildingId: { type: String }, // This can be optional or changed if needed

  appointmentDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // Example: "13:00"
  endTime: { type: String, required: true },

  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },

  propertyImage: { type: String }, // URL string
  message: { type: String, default: '' },

  rescheduleUuid: { type: String, default: null },
  rescheduledTo: { type: Date, default: null },
  feedback: {
    type: Map,
    of: Number, 
    default: {}
  }
}, {
  timestamps: true,
  collection: 'Appointment'
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
