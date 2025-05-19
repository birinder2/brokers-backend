const mongoose = require("mongoose");

// Address Schema
const addressSchema = new mongoose.Schema({
    street_type: String,
    street: String,
    number: Number,
    area: String,
    city: String,
    latitude: Number,
    longitude: Number,
    state: String,
    zip_code: String
  });
  
  // Image Schema
  const imageSchema = new mongoose.Schema({
    id: String,
    description: String,
    "200x140": String,
    "520x280": String,
    "1024x1024": String,
    "2280x1800": String
  });
  
  // Opportunity Schema
  const opportunitySchema = new mongoose.Schema({
    broker: Boolean,
    client: Boolean,
    exchange_units: Boolean,
    tenanted_investment_property: Boolean,
    social_housing_program: Boolean,
    featured_building: Boolean
  });
  
  // Developer Schema
  const developerSchema = new mongoose.Schema({
    id: String,
    name: String
  });
  
  // Publisher Schema
  const publisherSchema = new mongoose.Schema({
    id: String,
    name: String
  });

  const DynamicFieldSchema = new mongoose.Schema({
    aspect: String,
    details: String,
  }, { _id: false });

  const ComparisonSchema = new mongoose.Schema({
    region: String,
    similarFeatures: String,
  }, { _id: false });
  
  const ProfitabilitySchema = new mongoose.Schema({
    propertyType: String,
    revenue: String,
    expenses: String,
    netIncome: String,
  }, { _id: false });
  
  // Property Schema
  const propertySchema = new mongoose.Schema({
    id: String,
    name: { type: String, required: true },
    description: String,
    min_price: Number,
    max_price: Number,
    min_bedrooms: Number,
    max_bedrooms: Number,
    min_suites: Number,
    max_suites: Number,
    min_parking: Number,
    max_parking: Number,
    min_bathrooms: Number,
    max_bathrooms: Number,
    min_area: Number,
    max_area: Number,
    price_per_private_square_meter: Number,
    status: String,
    stage: String,
    features: [String],
    stock: Number,
    finality: String,
    updated_at: Date,
    orulo_url: String,
    portfolio: [String],
    developer: developerSchema,
    publisher: publisherSchema,
    opportunity: opportunitySchema,
    address: addressSchema,
    default_image: imageSchema,
    aditionalImages: [imageSchema],
    exchange_units: String,
    building_features: [{ name: String }],
    unit_features: [String],
    propertyImages: [String],
    is_developer_assigned: { type: Boolean, default: false },
    assigned_developer_id: { type: String, default: '' },
    assigned_developer_name: { type: String, default: '' },
    assigned_at: { type: Date, default: null },
  }, { collection: "Orulo_Building" });


  const OruloProperty = mongoose.model("Orulo_Building", propertySchema, "Orulo_Building");


  module.exports = OruloProperty;