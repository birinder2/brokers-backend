const mongoose = require('mongoose');

// Image Schema
const floorPlansSchema = new mongoose.Schema({
    id: String,
    description: String,
    title:String,
    status: {
      type: String,
      enum: ['enabled', 'disabled'],
      default: 'enabled'
    },
    "200x140": String,
    "520x280": String,
    "1024x1024": String,
    "2280x1800": String,
  });

  // Image Schema
const imageSchema = new mongoose.Schema({
    id: String,
    description: String,
    title:String,
    status: {
      type: String,
      enum: ['enabled', 'disabled'],
      default: 'enabled'
    },
    isDefault: { type: Boolean, default: false },
    "200x140": String,
    "520x280": String,
    "1024x1024": String,
    "2280x1800": String,
  });

// Building Additional Images Schema
const buildingAdditionalImagesSchema = new mongoose.Schema({
    building_id: { type: String, required: true },
    floor_plans: [floorPlansSchema],
    images: [imageSchema],
  });
  
  // Building Additional Images Model
  const BuildingAdditionalImages = mongoose.model(
    "Building_Additional_Images",
    buildingAdditionalImagesSchema,
    "Building_Additional_Images"
  );

  module.exports = BuildingAdditionalImages;