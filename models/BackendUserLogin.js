const mongoose = require("mongoose");

const backendUserLoginSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    description: { type: String, deafult: "" },
    image: { type: String, default: "" },
    status: { type: String, default: "active" },
    colorpicker_default:{type: String, default: ""},
    font_family:{type: String, default: ""},
    role: { type: String, default: "" },
  },
  { timestamps: true, collection: "Backend_User_Login" }
);

module.exports = mongoose.model("Backend_User_Login", backendUserLoginSchema);