const express = require("express");
const jwt = require("jsonwebtoken");
const Schedule = require('../models/Schedule');
const Salesman = require('../models/Salesman');

const viewSchedule = async (req, res) => {
    console.log('View schedule request params:');
    const salesId = req.params.id;
    if (!salesId) return res.status(400).json({ success: false, message: 'Salesman ID required.' });

    const salesman = await Salesman.findById(salesId)
    if (!salesman) return res.status(404).json({ success: false, message: 'Salesman not found.' });

    console.log('Salesman:', salesman);
    res.render('editBroker', { salesId: salesman._id,
        salesman: salesman  });
}


const addScheduleOldSushil = async (req, res) => {
    const { salesId, startTime, endTime, timeZone, applyTo, day } = req.body;
    // Check required fields
    if (!salesId || !startTime || !endTime || (applyTo === 'single' && !day)) {
        return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let daysToApply = [];

    // Determine which days to apply the schedule to
    if (applyTo === 'all') {
        daysToApply = weekDays;
    } else if (applyTo === 'remaining') {
        // Get the existing schedule for the salesman
        const existingSalesman = await Salesman.findById(salesId).select('schedule');
        const existingDays = existingSalesman ? existingSalesman.schedule.map(sch => sch.day) : [];
        daysToApply = weekDays.filter(d => !existingDays.includes(d));
    } else {
        daysToApply = [day];
    }

    // Loop through the days to apply the schedule
    const promises = daysToApply.map(async (d) => {
        let salesman = await Salesman.findById(salesId);
        if (salesman) {
            const existingSchedule = salesman.schedule.find(schedule => schedule.day === d);  // Note singular 'schedule'
            if (existingSchedule) {
                existingSchedule.slots.push({ startTime, endTime });
            } else {
                salesman.schedule.push({
                    day: d,
                    slots: [{ startTime, endTime }],
                    timeZone
                });
            }
            await salesman.save();
        } else {
            throw new Error('Salesman not found.');
        }
    });

    try {
        // Await all promises to ensure they are all completed before sending a response
        await Promise.all(promises);

        // Fetch the updated schedules for the salesman
        const updatedSalesman = await Salesman.findById(salesId).select('schedule');
        res.json({ success: true, data: updatedSalesman.schedule });
    } catch (err) {
        console.error('Error adding schedule:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const addSchedule = async (req, res) => {
    const { salesId, startTime, endTime, timeZone, applyTo, day } = req.body;

    if (!salesId || !startTime || !endTime || (applyTo === 'single' && !day)) {
        return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let daysToApply = [];

    if (applyTo === 'all') {
        daysToApply = weekDays;
    } else if (applyTo === 'remaining') {
        const existingSalesman = await Salesman.findById(salesId).select('schedule');
        const existingDays = existingSalesman ? existingSalesman.schedule.map(sch => sch.day) : [];
        daysToApply = weekDays.filter(d => !existingDays.includes(d));
    } else {
        daysToApply = [day];
    }

    try {
        const promises = daysToApply.map(async (d) => {
            const salesman = await Salesman.findById(salesId);
            if (!salesman) throw new Error('Salesman not found.');

            const existingSchedule = salesman.schedule.find(s => s.day === d);
            if (existingSchedule) {
                const isDuplicate = existingSchedule.slots.some(slot =>
                    slot.startTime === startTime && slot.endTime === endTime
                );
                if (!isDuplicate) {
                    existingSchedule.slots.push({ startTime, endTime });
                }
            } else {
                salesman.schedule.push({
                    day: d,
                    slots: [{ startTime, endTime }],
                    timeZone
                });
            }

            await salesman.save();
        });

        await Promise.all(promises);

        const updatedSalesman = await Salesman.findById(salesId).select('schedule');
        res.json({ success: true, data: updatedSalesman.schedule });

    } catch (err) {
        console.error('Error adding schedule:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};








// Get all schedules for a salesman


// const addSchedule = async (req, res) => {
//     const { salesId, startTime, endTime, timeZone, applyTo, day } = req.body;

//     if (!salesId || !startTime || !endTime || (applyTo === 'single' && !day)) {
//         return res.status(400).json({ success: false, message: 'Required fields are missing.' });
//     }

//     const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
//     let daysToApply = [];

//     if (applyTo === 'all') {
//         daysToApply = weekDays;
//     } else if (applyTo === 'remaining') {
//         const existingSalesman = await Salesman.findById(salesId).select('schedule');
//         const existingDays = existingSalesman ? existingSalesman.schedule.map(sch => sch.day) : [];
//         daysToApply = weekDays.filter(d => !existingDays.includes(d));
//     } else {
//         daysToApply = [day];
//     }

//     try {
//         const promises = daysToApply.map(async (d) => {
//             const salesman = await Salesman.findById(salesId);
//             if (!salesman) throw new Error('Salesman not found.');

//             const existingSchedule = salesman.schedule.find(s => s.day === d);
//             if (existingSchedule) {
//                 const hasOverlap = existingSchedule.slots.some(slot =>
//                     startTime < slot.endTime && endTime > slot.startTime
//                 );

//                 if (hasOverlap) {
//                     // Overlap found — skip adding
//                     return;
//                 }

//                 existingSchedule.slots.push({ startTime, endTime });
//             } else {
//                 salesman.schedule.push({
//                     day: d,
//                     slots: [{ startTime, endTime }],
//                     timeZone
//                 });
//             }

//             await salesman.save();
//         });

//         await Promise.all(promises);

//         const updatedSalesman = await Salesman.findById(salesId).select('schedule');
//         res.status(200).json({ success: true, data: updatedSalesman.schedule });

//     } catch (err) {
//         console.error('Error adding schedule:', err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };





const getSchedules = async (req, res) => {
    const { salesId } = req.query;
    if (!salesId) return res.status(400).json({ success: false, message: 'Salesman ID required.' });

    const salesman = await Salesman.findById(salesId).select('schedule');
    res.json({ success: true, data: salesman.schedule });
};

// Express route controller to get salesmen with a non-empty schedule
const getAvailableSalesmen = async (req, res) => {
    try {
      // Find salesmen where the schedule array has at least one entry
      const salesmen = await Salesman.find(
        { 'schedule.0': { $exists: true } }, 
        'name email phone -_id'  // include only name, email, phone; exclude _id
      );
  
      // Respond with the list of matching salesmen
      return res.status(200).json(salesmen);
    } catch (error) {
      console.error('Error fetching available salesmen:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  };


const deleteSchedules = async (req, res) => {
    try {
        const { salesId, days } = req.body;
        if (!salesId || !Array.isArray(days) || days.length === 0) {
            return res.status(400).json({ success: false, message: 'salesId and days are required.' });
        }

        // Find the salesman by salesId
        const salesman = await Salesman.findById(salesId);
        if (!salesman) {
            return res.status(404).json({ success: false, message: 'Salesman not found.' });
        }

        // Filter out the schedules for the days to be deleted
        salesman.schedule = salesman.schedule.filter(daySchedule => !days.includes(daySchedule.day));

        // Save the updated salesman document
        await salesman.save();

        // Return the updated schedule list for the salesman
        return res.status(200).json({
            success: true,
            message: 'Schedule(s) deleted successfully.',
            data: salesman.schedule // Return the updated schedule field
        });
    } catch (error) {
        console.error('Delete schedule error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    addSchedule,
    getSchedules,
    getAvailableSalesmen,
    deleteSchedules,
    viewSchedule
};