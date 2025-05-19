
const mongoose = require('mongoose');


// Define Mongoose User Schema
const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, trim: true },
      phone: { type: Number, required: true, unique: true },
      phoneCode: { type: String, required: true },
      password: { type: String, required: true },
      terms: { type: Boolean, required: true },
      otp: { type: String }, // OTP will be stored here temporarily
      otpExpires: { type: Date }, // OTP expiration time
      isOtpVerified: { type: Boolean, default: false },
      active: { type: Boolean, default: false },
      accessToken: { type: String, default: "" }, // Store Access Token
      refreshToken: { type: String, default: "" }, // Store Refresh Token
      progress: { type: Number, default: 0 } // Add progress field to track user's progress

    },
    { timestamps: true }
  );
  
  const User = mongoose.model("User", userSchema);

  module.exports = User;