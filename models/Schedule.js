const mongoose = require('mongoose');


const scheduleSchema = new mongoose.Schema({
    salesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesman', required: true },
    day: { type: String, required: true }, // e.g., 'Monday'
    slots: [
        {
            startTime: { type: String, required: true }, // '10:00'
            endTime: { type: String, required: true },   // '22:00'
        }
    ],
    timeZone: { type: String, default: 'UTC' }
}, { timestamps: true,collection: 'Schedule' });

module.exports = mongoose.model('Schedule', scheduleSchema);