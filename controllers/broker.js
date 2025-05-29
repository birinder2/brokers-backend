const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const moment = require('moment-timezone');
const path = require("path");
//const fs = require("fs");
const Salesman = require("../models/Salesman");
const Schedule = require("../models/Schedule");
const BackendUserLogin = require("../models/BackendUserLogin");

const sharp = require('sharp');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs/promises');

dotenv.config();
const keyPath = path.join(__dirname, '../public/laik-staging-b9958643e415.json');
const bucketName = 'laik_staging_bucket';
const destinationPath = 'assets/images/laik/broker';
const storage = new Storage({ keyFilename: keyPath });

const tempUploadDir = path.join(__dirname, '..', 'tmp', 'uploads');
const upload = multer({
  dest: tempUploadDir,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg", "image/webp", "image/svg+xml"];
    cb(null, allowedTypes.includes(file.mimetype));
  }
}).single('image');

exports.broker= async (req, res) => {
  res.locals = { title: 'Brokers List' };
  res.render('BrokerList/brokers-list');
}

exports.getBrokerList = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortField = 'name',
        sortOrder = 'asc',
      } = req.query;

      //console.log("Query Params:", req.user._id); // Debugging line
      const brokerId = req.user.email;
              console.log("Brokers:", brokerId); // Debugging line

  
      const query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      };

      // if (brokerId) {
      //     query = { _id: new mongoose.Types.ObjectId(brokerId) };
      // }

      // let query = {
      //   $and: [
      //     { _id: new mongoose.Types.ObjectId(brokerId) },
      //     {
      //       $or: [
      //         { name: { $regex: search, $options: 'i' } },
      //         { email: { $regex: search, $options: 'i' } },
      //       ],
      //     },
      //   ],
      // };

  
      const sortOptions = {};
      sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
  
      const totalRecords = await Salesman.countDocuments({ email: brokerId  });
  
      const brokers = await Salesman.find({ email: brokerId  })
        .sort(sortOptions)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

        console.log("Brokers:", brokers);
  
      const formattedData = brokers.map((broker) => ({
        _id: broker._id,
        name: broker.name || '',
        email: broker.email || '',
        phoneCode: broker.phoneCode || '',
        phone: broker.phone || '',
        image: broker.image || '',
        status: broker.status || 'Inactive',
        slot_duration: broker.slot_duration || '',
      }));

      res.json({
        data: formattedData,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: parseInt(page),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
}

exports.saveBrokerOld = async (req, res) => {
  const uploadMiddleware = upload.single("image");

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: "error",
        message: "Image upload failed: " + err.message,
      });
    }

    try {
      const {
        name,
        email,
        password,
        phone,
        phoneCode,
        slot_duration,
        status,
        day,
        startTime,
        endTime,
        timeZone,
        applyTo,
      } = req.body;

      if (!name || !email || !phone || !phoneCode || !slot_duration) {
        return res.status(400).json({
          status: "error",
          message: "Please fill all required broker fields.",
        });
      }

      const existingEmail = await Salesman.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          status: "error",
          message: "Email already exists.",
        });
      }

      const existingPhone = await Salesman.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          status: "error",
          message: "Phone already exists.",
        });
      }

      

      const image = req.file ? req.file.filename : null;

      const newBroker = new Salesman({
        name,
        email,
        phone,
        phoneCode,
        slot_duration,
        status,
        image,
        schedule: [],
      });

      // ==== Schedule Additions ====

      if (startTime && endTime && (applyTo || day)) {
        if (startTime === endTime) {
          return res.status(400).json({
            status: "error",
            message: "Start and end time cannot be the same.",
          });
        }

        const weekDays = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];

        let daysToApply = [];

        if (applyTo === "all") {
          daysToApply = weekDays;
        } else if (applyTo === "remaining") {
          const existingDays = newBroker.schedule.map((s) => s.day);
          daysToApply = weekDays.filter((d) => !existingDays.includes(d));
        } else {
          daysToApply = [day];
        }

        // Convert times to Brazil timezone
        const brazilStartTime = moment.tz(startTime, "HH:mm", process.env.TIMEZONE).format("HH:mm");
        const brazilEndTime = moment.tz(endTime, "HH:mm", process.env.TIMEZONE).format("HH:mm");

        // Add schedule slots directly inside salesman
        daysToApply.forEach((d) => {
          newBroker.schedule.push({
            day: d,
            startTime: brazilStartTime,
            endTime: brazilEndTime,
            timeZone: process.env.TIMEZONE,
            applyTo: applyTo,
          });
        });
      }

      await newBroker.save();

      // ==== Login Creation ====
      const existingLogin = await BackendUserLogin.findOne({ email });

      if (!existingLogin) {
        const hashedPassword = await bcrypt.hash(
          password,
          10
        );

        const userLogin = new BackendUserLogin({
          name,
          email,
          password: hashedPassword,
          role: process.env.ADMIN_SALESMAN_ROLE,
        });

        await userLogin.save();
      }

      return res.json({
        status: "success",
        message: "Broker added successfully.",
        data: newBroker,
      });

    } catch (err) {
      console.error("Add Broker Error:", err);
      return res.status(500).json({
        status: "error",
        message: "Server error while saving broker.",
      });
    }
  });
};

exports.saveBroker = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ status: 'error', message: 'Image upload failed' });
    }

    try {
      const {
        name,
        email,
        password,
        phone,
        phoneCode,
        slot_duration,
        status,
        day,
        startTime,
        endTime,
        timeZone,
        applyTo,
      } = req.body;

      if (!name || !email || !phone || !phoneCode || !slot_duration) {
        return res.status(400).json({
          status: "error",
          message: "Please fill all required broker fields.",
        });
      }

      const existingEmail = await Salesman.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          status: "error",
          message: "Email already exists.",
        });
      }

      const existingPhone = await Salesman.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          status: "error",
          message: "Phone already exists.",
        });
      }

      let imageUrl = null;

      // Upload to GCS if image is provided
      if (req.file) {
        const file = req.file;
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        const ext = path.extname(file.originalname);
        const bucket = storage.bucket(bucketName);
        const inputBuffer = await fs.readFile(file.path);

        const fullResBuffer = await sharp(inputBuffer)
          .resize(1000, 1000)
          .toBuffer();
        const fullResPath = `${destinationPath}/${timestamp}-${originalName}${ext}`;
        const fullResBlob = bucket.file(fullResPath);
        await fullResBlob.save(fullResBuffer, {
          contentType: file.mimetype,
          resumable: false,
        });

        imageUrl = `https://storage.googleapis.com/${bucketName}/${fullResPath}`;

        // Optionally clean up temp file
        await fs.unlink(file.path);
      }

      const newBroker = new Salesman({
        name,
        email,
        phone,
        phoneCode,
        slot_duration,
        status,
        image: imageUrl,
        schedule: [],
      });

      // ==== Schedule Additions ====

      if (startTime && endTime && (applyTo || day)) {
        if (startTime === endTime) {
          return res.status(400).json({
            status: "error",
            message: "Start and end time cannot be the same.",
          });
        }

        const weekDays = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];

        let daysToApply = [];

        if (applyTo === "all") {
          daysToApply = weekDays;
        } else if (applyTo === "remaining") {
          const existingDays = newBroker.schedule.map((s) => s.day);
          daysToApply = weekDays.filter((d) => !existingDays.includes(d));
        } else {
          daysToApply = [day];
        }

        const brazilStartTime = moment
          .tz(startTime, "HH:mm", process.env.TIMEZONE)
          .format("HH:mm");
        const brazilEndTime = moment
          .tz(endTime, "HH:mm", process.env.TIMEZONE)
          .format("HH:mm");

        daysToApply.forEach((d) => {
          newBroker.schedule.push({
            day: d,
            startTime: brazilStartTime,
            endTime: brazilEndTime,
            timeZone: process.env.TIMEZONE,
            applyTo: applyTo,
          });
        });
      }

      await newBroker.save();

      // ==== Login Creation ====
      const existingLogin = await BackendUserLogin.findOne({ email });

      if (!existingLogin) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const userLogin = new BackendUserLogin({
          name,
          email,
          password: hashedPassword,
          role: process.env.ADMIN_SALESMAN_ROLE,
        });

        await userLogin.save();
      }

      return res.json({
        status: "success",
        message: "Broker added successfully.",
        data: newBroker,
      });

    } catch (err) {
      console.error("Add Broker Error:", err);
      return res.status(500).json({
        status: "error",
        message: "Server error while saving broker.",
      });
    }
  });
};

exports.editBroker = async (req, res) => {
    const  id  = req.user.salesmanId;
    console.log("Edit Broker ID:", req.user); // Debugging line
    try {
        const broker = await Salesman.findById(id);
        if (!broker) {
            return res.status(404).json({ status: false, message: 'Broker not found' });
        }
        res.locals = { title: 'My Profile' };
        res.render('BrokerList/editBrokers', { salesId: id,
          salesman: broker });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Server error' });
    }
}

/* 
  exports.updateBrokerOld = [
    upload.single('image'),
    async (req, res) => {
      try {
        const { salesId, name, phone, phoneCode, slot_duration,status  } = req.body;
        console.log("Update Broker Request Body:", req.body);

        if (!salesId) return res.status(400).json({ success: false, message: 'Missing broker ID.' });

        const updateData = { name, phone, phoneCode, slot_duration,status };

        const existingPhone = await Salesman.findOne({ phone, _id: { $ne: salesId } });
        if (existingPhone) {
          return res.status(400).json({
            status: "error",
            message: "Phone already exists.",
          });
        }

        if (req.file) {
          updateData.image = req.file.filename;
        }

        const broker = await Salesman.findByIdAndUpdate(salesId, updateData, { new: true });

        if (!broker) {
          return res.status(404).json({ success: false, message: 'Broker not found.' });
        }

        res.json({ success: true, data: broker });
      } catch (error) {
        console.error("error", error);
        res.status(500).json({ success: false, message: error.message });
      }
    }
  ]; 
*/

exports.updateBroker = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ status: 'error', message: 'Image upload failed' });
    }

    try {
      const { salesId, name, phone, phoneCode, slot_duration } = req.body;

      if (!salesId)
        return res.status(400).json({ success: false, message: "Missing broker ID." });

      const updateData = { name, phone, phoneCode, slot_duration };

      const existingPhone = await Salesman.findOne({ phone, _id: { $ne: salesId } });
      if (existingPhone) {
        return res.status(400).json({
          status: "error",
          message: "Phone already exists.",
        });
      }

      const broker = await Salesman.findById(salesId);
      if (!broker) {
        return res.status(404).json({ success: false, message: "Broker not found." });
      }

      if (req.file) {
        const file = req.file;
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        const ext = path.extname(file.originalname);
        const bucket = storage.bucket(bucketName);
        const inputBuffer = await fs.readFile(file.path);

        const fullResBuffer = await sharp(inputBuffer)
          .resize(1000, 1000)
          .toBuffer();
        const fullResPath = `${destinationPath}/${timestamp}-${originalName}${ext}`;
        const fullResBlob = bucket.file(fullResPath);
        await fullResBlob.save(fullResBuffer, {
          contentType: file.mimetype,
          resumable: false,
        });

        const imageUrl = `https://storage.googleapis.com/${bucketName}/${fullResPath}`;
        updateData.image = imageUrl;

        // Optional: Delete previous image from GCS if stored there
        // if (broker.image?.includes('storage.googleapis.com')) {
        //   const prevImageKey = broker.image.split(`/${bucketName}/`)[1];
        //   if (prevImageKey) {
        //     await bucket.file(prevImageKey).delete().catch(err => {
        //       console.warn("Previous image deletion failed:", err.message);
        //     });
        //   }
        // }
        if (broker.image && broker.image.startsWith('https://storage.googleapis.com/')) {
          const oldImagePath = broker.image.replace(`https://storage.googleapis.com/${bucketName}/`, '');
          const oldBlob = bucket.file(oldImagePath);
          oldBlob.delete().catch(err => console.error('Error deleting old image from GCS:', err));
        }

        // Cleanup temp file
        await fs.unlink(file.path);
      }

      const updatedBroker = await Salesman.findByIdAndUpdate(salesId, updateData, {
        new: true,
      });

      res.status(200).json({ success: true, data: updatedBroker });
    } catch (error) {
      console.error("Update Broker Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

exports.updatePassword= async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({success: false, message: "Email and new password are required." });
  }

  try {
    const user = await BackendUserLogin.findOne({ email });
    if (!user) {
      return res.status(404).json({success: false, message: "Broker with this email not found." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return res.json({success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({success: true, message: error.message });
  }
};

exports.deleteBroker = async (req,res) => {
    try {
        const brokerId = req.params.id;
    
        const broker = await Salesman.findById(brokerId);
        if (!broker) {
          return res.status(404).json({ status: false, message: 'Broker not found' });
        }
    
        // Delete image file if it exists
        if (broker.image && broker.image.startsWith('https://storage.googleapis.com/')) {
          const bucket = storage.bucket(bucketName);
          const oldImagePath = broker.image.replace(`https://storage.googleapis.com/${bucketName}/`, '');
          const oldBlob = bucket.file(oldImagePath);
          oldBlob.delete().catch(err => console.error('Error deleting old image from GCS:', err));
        }
    
        // Delete broker from DB
        await Salesman.findByIdAndDelete(brokerId);
    
        return res.status(200).json({ status: true, message: 'Broker deleted successfully' });
      } catch (error) {
        console.log('Delete broker error:', error);
        return res.status(500).json({ status: false, message: error.message });
      }
}
