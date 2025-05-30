const Appointment = require("../models/Appointment"); // assuming you have this schema
const Salesman = require("../models/Salesman");
const Property = require("../models/Properties");
const mongoose = require("mongoose");
const moment = require("moment");
const { Types } = require('mongoose');


exports.viewAppointments = async (req, res) => {
  const brokers = await Salesman.find({}, "name");
  res.locals = { title: 'Scheduled Visits' };
  res.render('Bookings/schedule-visits-list', { moment, brokers });
  //res.render("bookings", { moment }); // Pass moment to the EJS file
};

exports.viewAppointmentsList = async (req, res) => {
  const brokers = await Salesman.find({}, "name");
  res.locals = { title: 'Scheduled Visits' };
  res.render('Bookings/schedule-visits-list', { moment, brokers });
  //res.render("bookings", { moment }); // Pass moment to the EJS file
};


const formatTime = (timeStr) => {
  return moment(`2000-01-01T${timeStr}`, "YYYY-MM-DDTHH:mm").format("hh:mm A");
};

exports.getAppointments = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "appointmentDate",
      sortOrder = "asc",
      month,
      year,
      status,
      
      view = "list",
    } = req.query;

    console.log("Query Params:", req.query); // Debugging line

    let sess = req.session;
    //brokerId = (sess.broker_id)? sess.broker_id : '';
      const  brokerId  = req.user._id;

    console.log("Broker ID from session:", req.user);
    const skip = (page - 1) * limit;
    const sortOptions = {};
    if (sortBy) sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Build filter query
    const filter = {};

    if (month || year) {
      const startDate = moment()
        .year(year || moment().year())
        .month(month ? parseInt(month) - 1 : 0)
        .startOf("month")
        .toDate();

      const endDate = moment(startDate).endOf("month").toDate();

      filter.appointmentDate = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ["scheduled", "completed", "cancelled"] };
    }

    
    //console.log("Final filter sent to Mongo:", filter);
    //console.log("Final sort sent to Mongo:", sortOptions);

    const appointments = await Appointment.find(filter)
      .populate({
        path: "propertyId",
        select: "name default_image.200x140",
      })
      .populate({
        path: "salesId",
        select: "name _id",
      })
      .sort(sortOptions);

    let filteredAppointments = appointments;

    // console.log("Total appointments fetched:", appointments);

    if (search.trim() !== "" && view === "list") {
      const searchLower = search.toLowerCase();
      filteredAppointments = appointments.filter((app) => {
        const property = app.propertyId?.name?.toLowerCase() || "";
        const salesman = app.salesId?.name?.toLowerCase() || "";
        return property.includes(searchLower) || salesman.includes(searchLower);
      });
    }
    if (brokerId) {
      //console.log("Salesman ID:", brokerId);
      const someSalesId = new Types.ObjectId(brokerId);
      filteredAppointments = filteredAppointments.filter((app) => {
        return app.salesId && app.salesId._id.toString() === brokerId.toString();
        //return app.salesId && app.salesId._id.toString() === "6800c4eb0480ef79cc39dde4";
        //return app.salesId && app.salesId._id && app.salesId._id.equals(someSalesId)
      });
    }
    // console.log("Filtered appointments after search:", filteredAppointments);

    const totalRecords = filteredAppointments.length;
    let paginatedAppointments;
    if(view === "calendar") {
      paginatedAppointments = filteredAppointments;
    }
    else{
      paginatedAppointments = filteredAppointments.slice(
        skip,
        skip + parseInt(limit)
      );
    }


    const formattedData = paginatedAppointments.map((app) => ({
      _id: app._id,
      propertyName: app.propertyId?.name || "N/A",
      propertyImage: app.propertyImage || "/images/default.png",
      salesmanName: app.salesId?.name || "N/A",
      appointmentDate: app.appointmentDate,
      startTime: formatTime(app.startTime),
      endTime: formatTime(app.endTime),
      status: app.status,
      message: app.message || "",
      feedback: app.feedback || {},
    }));

    res.status(200).json({
      data: formattedData,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSalesmen = async (req, res) => {
  try {
    const salesmen = await Salesman.find({}, "name");
    res.json(salesmen);
  } catch (error) {
    console.error("Error fetching salesmen:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 
