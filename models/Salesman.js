const mongoose = require('mongoose');

// Define the Schedule schema for each day
const scheduleSchema = new mongoose.Schema({
  day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  slots: [{
      startTime: { type: String, required: true },  // Time format: "HH:mm"
      endTime: { type: String, required: true },    // Time format: "HH:mm"
  }],
  timeZone: { type: String, default: 'America/Sao_Paulo'  }     // Time zone (optional)

});


// Salesman schema (Mongoose Model)
const salesmanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    phoneCode: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    slot_duration: { type: Number, default: 60 }, 
    status: { type: String, enum: ['active', 'on_leave','inactive'], default: 'active' }, 
    schedule: [scheduleSchema],
  }, { timestamps: true, collection: 'Salesman' });
  
  const Salesman = mongoose.models.Salesman ||mongoose.model('Salesman', salesmanSchema);

  module.exports = Salesman;