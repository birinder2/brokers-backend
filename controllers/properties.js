const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const Salesman = require("../models/Salesman")
const Property = require("../models/Properties")
const multer = require('multer');
const path = require('path');
dotenv.config({ path: "./.env" });
const sharp = require('sharp');
const { Types } = mongoose;



const { Storage } = require('@google-cloud/storage');
const Developer = require("../models/BackendUserLogin");



const BuildingAdditionalImages = require("../models/BuildingAdditionalImages");

//const fs = require('fs').promises;
const fs = require('fs/promises');


// Google Cloud setup (no keys needed if on staging)
// Create GCS storage client
console.log("Using credentials from:", process.env.GOOGLE_APPLICATION_CREDENTIALS);

const keyPath = path.join(__dirname, '../public/laik-staging-b9958643e415.json');

console.log("Using credentials from:", keyPath);

const storage = new Storage({
  keyFilename: keyPath,
  //projectId: 'your-project-id', // optional if inside JSON
});
const bucketName = 'laik_staging_bucket';
const destinationPath = 'assets/images/laik';


exports.properties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const sortBy = req.query.sortBy || 'name';  // Default sorting by name
        const sortOrder = req.query.sortOrder || 'asc'; // Default sorting order ascending
        const developerId = req.query.developerId || null;

        const queryString = new URLSearchParams(
          Object.fromEntries(
            Object.entries(req.query).filter(([_, v]) => v !== '')
          )
        ).toString();
        const urlParam = `&${queryString}`;

        const filters = {};

        // Handling search filters
        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { "address.street": { $regex: search, $options: 'i' } },
                { "address.area": { $regex: search, $options: 'i' } }
            ];
        }

        if(developerId){
            filters.developer_id = developerId;

        }

        console.log("Filters:", filters); // Log the filters for debugging

        // Create a sorting object dynamically based on the sortBy and sortOrder parameters
        const sortObject = {};
        sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;  // Ascending or descending

        const skip = (page - 1) * limit;

        // Fetch properties and total count concurrently
        const [properties, totalCount] = await Promise.all([
            Property.find(filters)
                .select({ name: 1, default_image: 1, address: 1,id:1,status:1,isPublish:1 })
                .skip(skip)
                .limit(limit)
                .sort(sortObject),  // Apply sorting
            Property.countDocuments(filters)
        ]);

        // Map properties to match the structure required by the frontend
        const data = properties.map((property) => {
            const addr = property.address;
            const fullAddress = addr
            ? [
                addr.street_type,
                addr.street,
                addr.number,
                addr.area,
                addr.city,
                addr.state,
                addr.zip_code,
              ]
              .filter(part => String(part).trim() !== '')
              .join(', ')
            : 'N/A';
            return {
                image: property.default_image?.["200x140"] || "N/A",
                address: fullAddress,
                name: property.name,
                id: property.id,
                isPublish: property.isPublish,
                action: `
                <div class="btn-group dropstart">
                      <button class="btn btn-blue-grey btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                          Action
                          <i class="mdi mdi-chevron-down"></i>
                      </button>
                      <div class="dropdown-menu dropdown-menu-start">
                          <a class="dropdown-item" href="/addEditProperty?propertyId=${property._id}${urlParam}"><i class="mdi mdi-pencil font-size-18"></i> Edit</a>
                          <a class="dropdown-item building-delete" id="property-delete" href="#" data-id="${property._id}"><i class="mdi mdi-delete font-size-18"></i> Delete</a>
                                     

                          <a class="dropdown-item" href="/viewPropertyImages?propertyId=${property._id}${urlParam}"><i class="mdi mdi-file-image font-size-18"></i> View / Add Images</a>
                          <a class="dropdown-item" href="/viewPropertyFloorImages?propertyId=${property._id}${urlParam}"><i class="mdi mdi-trello font-size-18"></i> View / Add Plans</a>
                      </div>
                  </div>
                 `
            };
        });

        const totalPages = Math.ceil(totalCount / limit);

        // Send response with properties data and pagination information
        res.json({
            data,
            totalPages,
            currentPage: page,
            totalRecords: totalCount
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};


exports.editProperties = async (req, res) => {
  const propertyId = req.query.propertyId;
  console.log("Property ID:", propertyId); // Log the property ID for debugging
  try {
    const developers = await Developer.find({ role: 'developer' });
    if (!propertyId) {
        // If the id is 'new', we're in the add mode and should pass empty data
        res.locals = { title: 'Add Building ' };
        return res.render('Building/edit-building', { property: {} ,developers});
      }
      const property = await Property.findById(propertyId);
      if (!property) {
          return res.status(404).json({ error: "Property not found" });
      }
      res.locals = { title: 'Edit Building' };
      res.render('Building/edit-building', { property,developers });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};




// const storageFile = multer.diskStorage({
//   destination: function (req, file, cb) {
//       cb(null, 'uploads/'); // Ensure this folder exists
//   },
//   filename: function (req, file, cb) {
//       const ext = path.extname(file.originalname);
//       cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/pdf') {
//       cb(null, true);
//   } else {
//       cb(new Error('Only PDF files allowed!'), false);
//   }
// };

// const uploadPdf = multer({ storageFile, fileFilter });

// Multer Memory Storage
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed!'), false);
    }
  },
});

exports.addProperties =[uploadPdf.array('addbooks', 10),async (req, res) => {
  try {
    const updatedData = req.body;
    const bucket = storage.bucket(bucketName);

    // Parse nested JSON strings into actual objects
    if (updatedData.opportunity && typeof updatedData.opportunity === 'string') {
      updatedData.opportunity = JSON.parse(updatedData.opportunity);
  }

  if (updatedData.address && typeof updatedData.address === 'string') {
      updatedData.address = JSON.parse(updatedData.address);
  }

  if (updatedData.developer && typeof updatedData.developer === 'string') {
      updatedData.developer = JSON.parse(updatedData.developer);
  }

  if (updatedData.safety && typeof updatedData.safety === 'string') {
    updatedData.safety = JSON.parse(updatedData.safety);
  }

  if (updatedData.comparison_with_safe_regions  && typeof updatedData.comparison_with_safe_regions  === 'string') {
    updatedData.comparison_with_safe_regions  = JSON.parse(updatedData.comparison_with_safe_regions );
  }

  if (updatedData.points_of_attention  && typeof updatedData.points_of_attention  === 'string') {
    updatedData.points_of_attention  = JSON.parse(updatedData.points_of_attention );
  }

  if (updatedData.profitability_analysis
    && typeof updatedData.profitability_analysis
    === 'string') {
    updatedData.profitability_analysis
    = JSON.parse(updatedData.profitability_analysis
    );
  }

      // Handle addbooks (uploaded multiple PDFs)
      const uploadedFiles = [];

      // Upload PDFs to GCS
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const gcsFileName = `assets/images/laik/${Date.now()}-${file.originalname}`;
          const blob = bucket.file(gcsFileName);

          const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
          });

          await new Promise((resolve, reject) => {
            blobStream.on('finish', () => {
              const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
              uploadedFiles.push(publicUrl);
              resolve();
            }).on('error', (err) => {
              console.error('Upload Error:', err);
              reject(err);
            }).end(file.buffer);
          });
        }

        updatedData.addbooks = uploadedFiles;
      }
      // Create a new property instance using the data from the request body
      const newProperty = new Property(updatedData);

      // Save the new property to the database
      await newProperty.save();

      // Respond with a success message and the saved property
      res.status(201).json({ success:true,message: 'Property added successfully', property: newProperty });
  } catch (error) {
      console.error(error);
      res.status(500).json({success:false, message: 'Error adding property', error });
  }
}]


exports.updateProperties = [uploadPdf.array('addbooks', 10), async (req, res) => {
  try {
    const propertyId = req.params.id;
    const updatedData = req.body;
    const bucket = storage.bucket(bucketName);

    // Parse nested JSON strings into actual objects
    if (updatedData.opportunity && typeof updatedData.opportunity === 'string') {
      updatedData.opportunity = JSON.parse(updatedData.opportunity);
    }

    if (updatedData.address && typeof updatedData.address === 'string') {
      updatedData.address = JSON.parse(updatedData.address);
    }

    if (updatedData.developer && typeof updatedData.developer === 'string') {
      updatedData.developer = JSON.parse(updatedData.developer);
    }

    if (updatedData.safety && typeof updatedData.safety === 'string') {
      updatedData.safety = JSON.parse(updatedData.safety);
    }

    if (updatedData.comparison_with_safe_regions && typeof updatedData.comparison_with_safe_regions === 'string') {
      updatedData.comparison_with_safe_regions = JSON.parse(updatedData.comparison_with_safe_regions);
    }

    if (updatedData.points_of_attention && typeof updatedData.points_of_attention === 'string') {
      updatedData.points_of_attention = JSON.parse(updatedData.points_of_attention);
    }

    if (updatedData.profitability_analysis && typeof updatedData.profitability_analysis === 'string') {
      updatedData.profitability_analysis = JSON.parse(updatedData.profitability_analysis);
    }

    // Fetch existing property first
    const existingProperty = await Property.findById(propertyId);
    if (!existingProperty) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Handle removeBooks (PDFs to delete)
    const removeBooks = updatedData.removeBooks ? JSON.parse(updatedData.removeBooks) : [];
    const existingBooks = existingProperty.addbooks || [];

    // Filter out removed PDFs from existing ones
    const retainedBooks = existingBooks.filter(book => {
      if (removeBooks.includes(book)) {
        // Optional: Delete file from GCS
        const filePath = book.replace(`https://storage.googleapis.com/${bucketName}/`, '');
        bucket.file(filePath).delete().catch(err => {
          console.warn('GCS delete failed for', filePath, err.message);
        });
        return false;
      }
      return true;
    });

    // Upload new PDFs to GCS
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const gcsFileName = `assets/images/laik/${Date.now()}-${file.originalname}`;
        const blob = bucket.file(gcsFileName);

        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: file.mimetype,
        });

        await new Promise((resolve, reject) => {
          blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
            uploadedFiles.push(publicUrl);
            resolve();
          }).on('error', (err) => {
            console.error('Upload Error:', err);
            reject(err);
          }).end(file.buffer);
        });
      }
    }

    // Final book list = retained + newly uploaded
    updatedData.addbooks = [...retainedBooks, ...uploadedFiles];

    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(propertyId, updatedData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, message: 'Property updated successfully', data: updatedProperty });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating property', error });
  }
}];



exports.viewUploadPropertyImage = async (req, res) => {
    const propertyId = req.query.propertyId;
    res.locals = { title: 'Building Images' };
    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }
        
        res.render('Building/propertyImages', { property });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

exports.viewUploadPropertyFloorImage = async (req, res) => {
    const propertyId = req.query.propertyId;
    res.locals = { title: ' Floor Plans Images' };
    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }
        
        res.render('Building/propertyFloorImages', { property });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storageImage }); 

const sizes = [
  { label: '200x140', width: 200, height: 140 },
  { label: '520x280', width: 520, height: 280 },
  { label: '1024x1024', width: 1024, height: 1024 },
  { label: '2280x1800', width: 2280, height: 1800 },
];


const sizePaths = {
  '200x140': 'assets/images/laik/thumb',
  '520x280': 'assets/images/laik/medium',
  '1024x1024': 'assets/images/laik/large',
  '2280x1800': 'assets/images/laik/xlarge'
};
// exports.uploadPropertyImages = [
//   upload.array('images', 10),
//   async (req, res) => {
//     try {
//       const buildingId = req.body.buildingId;
//       const descriptions = req.body['descriptions[]'] || req.body.descriptions || [];
//       const status = req.body.status || 'enabled';

//       if (!buildingId || !req.files || req.files.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing buildingId or images.'
//         });
//       }

//       // Normalize descriptions into an array
//       const descriptionList = Array.isArray(descriptions)
//         ? descriptions
//         : [descriptions];

//       const uploadedImages = await Promise.all(
//         req.files.map(async (file, index) => {
//           const timestamp = Date.now();
//           const originalName = path.parse(file.originalname).name;
//           const ext = path.extname(file.originalname);
//           const bucket = storage.bucket(bucketName);

//           const imageInfo = {
//             status,
//             id: `${timestamp}-${file.originalname}`,
//             description: descriptionList[index] || ''
//           };

//           const inputBuffer = await fs.readFile(file.path);

//           // Full resolution
//           const fullResBuffer = await sharp(inputBuffer)
//             .resize(2280, 1800)
//             .toBuffer();
//           const fullResPath = `${destinationPath}/${timestamp}-${originalName}${ext}`;
//           const fullResBlob = bucket.file(fullResPath);
//           await fullResBlob.save(fullResBuffer, {
//             contentType: file.mimetype,
//             resumable: false
//           });
//           imageInfo['2280x1800'] = `https://storage.googleapis.com/${bucketName}/${fullResPath}`;

//           // Other sizes
//           await Promise.all(
//             sizes.map(async (size) => {
//               const resizedBuffer = await sharp(inputBuffer)
//                 .resize(size.width, size.height)
//                 .toBuffer();

//               const resizedPath = `${destinationPath}/${timestamp}-${originalName}-${size.label}${ext}`;
//               const resizedBlob = bucket.file(resizedPath);
//               await resizedBlob.save(resizedBuffer, {
//                 contentType: file.mimetype,
//                 resumable: false
//               });

//               imageInfo[size.label] = `https://storage.googleapis.com/${bucketName}/${resizedPath}`;
//             })
//           );

//           await fs.unlink(file.path);
//           return imageInfo;
//         })
//       );

//       // Save to MongoDB
//       const existing = await BuildingAdditionalImages.findOne({ building_id: buildingId });

//       if (existing) {
//         existing.images.push(...uploadedImages);
//         await existing.save();
//       } else {
//         await BuildingAdditionalImages.create({
//           building_id: buildingId,
//           images: uploadedImages,
//           floor_plans: []
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         message: 'Images uploaded and resized successfully.',
//         images: uploadedImages
//       });

//     } catch (err) {
//       console.error('Error uploading images:', err);
//       return res.status(500).json({
//         success: false,
//         message: err.message
//       });
//     }
//   }
// ];


// exports.uploadPropertyImages = [
//   upload.array('images', 10),
//   async (req, res) => {
//     try {
//       const buildingId = req.body.buildingId;
//       const descriptions = req.body['descriptions[]'] || req.body.descriptions || [];
//       const status = req.body.status || 'enabled';

//       if (!buildingId || !req.files || req.files.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing buildingId or images.'
//         });
//       }

//       const descriptionList = Array.isArray(descriptions)
//         ? descriptions
//         : [descriptions];

//       const uploadedImages = await Promise.all(
//         req.files.map(async (file, index) => {
//           const timestamp = Date.now();
//           const originalName = path.parse(file.originalname).name.replace(/\s+/g, '-');

//           const ext = path.extname(file.originalname);
//           const bucket = storage.bucket(bucketName);

//           const imageInfo = {
//             status,
//             id: `${timestamp}`,
//             description: descriptionList[index] || ''
//           };

//           const inputBuffer = await fs.readFile(file.path);

//           // 2280x1800 image upload to xlarge
//           const fullResBuffer = await sharp(inputBuffer)
//             .resize(2280, 1800)
//             .toBuffer();

//           const fullResDir = sizePaths['2280x1800'];
//           const fullResFileName = `${timestamp}-${originalName}${ext}`;
//           const fullResPath = `${fullResDir}/${fullResFileName}`;
//           const fullResBlob = bucket.file(fullResPath);
//           await fullResBlob.save(fullResBuffer, {
//             contentType: file.mimetype,
//             resumable: false
//           });

//           // Set the title field using 2280x1800 image filename
//           const titleName = path.parse(originalName).name;
//           console.log("titleName",titleName);
//           imageInfo.title = titleName;
//           imageInfo['2280x1800'] = `https://storage.googleapis.com/${bucketName}/${fullResPath}`;

//           // Upload resized images (other sizes)
//           await Promise.all(
//             sizes.map(async (size) => {
//               const resizedBuffer = await sharp(inputBuffer)
//                 .resize(size.width, size.height)
//                 .toBuffer();

//               const sizeLabel = size.label;
//               const dirPath = sizePaths[sizeLabel];
//               const resizedFileName = `${timestamp}${ext}`;
//               const resizedPath = `${dirPath}/${resizedFileName}`;
//               const resizedBlob = bucket.file(resizedPath);
//               await resizedBlob.save(resizedBuffer, {
//                 contentType: file.mimetype,
//                 resumable: false
//               });

//               imageInfo[sizeLabel] = `https://storage.googleapis.com/${bucketName}/${resizedPath}`;
//             })
//           );

//           await fs.unlink(file.path); // delete temp file
//           return imageInfo;
//         })
//       );

//       // Save to MongoDB
//       const existing = await BuildingAdditionalImages.findOne({ building_id: buildingId });

//       if (existing) {
//         existing.images.push(...uploadedImages);
//         await existing.save();
//       } else {
//         await BuildingAdditionalImages.create({
//           building_id: buildingId,
//           images: uploadedImages,
//           floor_plans: []
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         message: 'Images uploaded and resized successfully.',
//         images: uploadedImages
//       });

//     } catch (err) {
//       console.error('Error uploading images:', err);
//       return res.status(500).json({
//         success: false,
//         message: err.message
//       });
//     }
//   }
// ];


exports.uploadPropertyImages = [
  upload.array('images', 10),
  async (req, res) => {
    try {
      const buildingId = req.body.buildingId;
      const descriptions = req.body['descriptions[]'] || req.body.descriptions || [];
      const status = req.body.status || 'enabled';

      if (!buildingId || !req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing buildingId or images.'
        });
      }

      const descriptionList = Array.isArray(descriptions) ? descriptions : [descriptions];
      const webpOptions = { quality: 80 }; // adjust WebP quality as needed
      const bucket = storage.bucket(bucketName);

      const uploadedImages = await Promise.all(
        req.files.map(async (file, index) => {
          const timestamp = Date.now();
          const originalName = path.parse(file.originalname).name.replace(/\s+/g, '-');
          const inputBuffer = await fs.readFile(file.path);

          const imageInfo = {
            status,
            id: `${timestamp}`,
            description: descriptionList[index] || ''
          };

          // === Main 2280x1800 Image (.webp) ===
          const fullResBuffer = await sharp(inputBuffer)
            .resize(2280, 1800)
            .webp(webpOptions)
            .toBuffer();

          const fullResDir = sizePaths['2280x1800'];
          const fullResFileName = `${timestamp}-${originalName}.webp`;
          const fullResPath = `${fullResDir}/${fullResFileName}`;
          const fullResBlob = bucket.file(fullResPath);

          await fullResBlob.save(fullResBuffer, {
            contentType: 'image/webp',
            resumable: false
          });

          imageInfo.title = originalName;
          imageInfo['2280x1800'] = `https://storage.googleapis.com/${bucketName}/${fullResPath}`;

          // === Other Sizes (.webp) ===
          await Promise.all(
            sizes.map(async (size) => {
              const resizedBuffer = await sharp(inputBuffer)
                .resize(size.width, size.height)
                .webp(webpOptions)
                .toBuffer();

              const sizeLabel = size.label;
              const dirPath = sizePaths[sizeLabel];
              const resizedFileName = `${timestamp}-${sizeLabel}.webp`;
              const resizedPath = `${dirPath}/${resizedFileName}`;
              const resizedBlob = bucket.file(resizedPath);

              await resizedBlob.save(resizedBuffer, {
                contentType: 'image/webp',
                resumable: false
              });

              imageInfo[sizeLabel] = `https://storage.googleapis.com/${bucketName}/${resizedPath}`;
            })
          );

          await fs.unlink(file.path); // Delete temp file
          return imageInfo;
        })
      );

      
      const existing = await BuildingAdditionalImages.findOne({ building_id: buildingId });

      if (existing) {
        existing.images.push(...uploadedImages);
        await existing.save();
      } else {
        await BuildingAdditionalImages.create({
          building_id: buildingId,
          images: uploadedImages,
          floor_plans: []
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Images uploaded, and resized successfully.',
        images: uploadedImages
      });

    } catch (err) {
      console.error('Error uploading images:', err);
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
];


// exports.uploadPropertyFloorImages = [
//   upload.array('images', 10),
//   async (req, res) => {
//     try {
//       const buildingId = req.body.buildingId;
//       const descriptions = req.body['descriptions[]'] || req.body.descriptions || [];

//       if (!buildingId || !req.files?.length) {
//         return res.status(400).json({ success: false, message: 'Missing buildingId or images.' });
//       }

//       const descriptionList = Array.isArray(descriptions) ? descriptions : [descriptions];

//       const uploadedImages = await Promise.all(
//         req.files.map(async (file, index) => {
//           const timestamp = Date.now();
//           const originalName = path.parse(file.originalname).name;
//           const ext = path.extname(file.originalname);
//           const bucket = storage.bucket(bucketName);
//           const inputBuffer = await fs.readFile(file.path);

//           const fullSizeBuffer = await sharp(inputBuffer)
//             .resize(1024, 1024)
//             .toBuffer();

//           const file1024Name = `${destinationPath}/${timestamp}-${originalName}-1024x1024${ext}`;
//           await bucket.file(file1024Name).save(fullSizeBuffer, {
//             contentType: file.mimetype,
//             resumable: false,
//           });
//           const url1024 = `https://storage.googleapis.com/${bucketName}/${file1024Name}`;

//           const thumbBuffer = await sharp(fullSizeBuffer)
//             .resize(200, 140)
//             .toBuffer();

//           const file200Name = `${destinationPath}/${timestamp}-${originalName}-200x140${ext}`;
//           await bucket.file(file200Name).save(thumbBuffer, {
//             contentType: file.mimetype,
//             resumable: false,
//           });
//           const url200 = `https://storage.googleapis.com/${bucketName}/${file200Name}`;

//           await fs.unlink(file.path); // delete local temp file

//           return {
//             id: `${timestamp}-${file.originalname}`,
//             description: descriptionList[index] || '',
//             '1024x1024': url1024,
//             '200x140': url200,
//           };
//         })
//       );

//       const existing = await BuildingAdditionalImages.findOne({ building_id: buildingId });

//       if (existing) {
//         existing.floor_plans.push(...uploadedImages);
//         await existing.save();
//       } else {
//         await BuildingAdditionalImages.create({
//           building_id: buildingId,
//           floor_plans: uploadedImages,
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: 'Floor plan images uploaded and resized.',
//         images: uploadedImages,
//       });
//     } catch (err) {
//       console.error('Upload error:', err);
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// ];

exports.uploadPropertyFloorImages = [
  upload.array('images', 10),

  async (req, res) => {
    try {
      const buildingId = req.body.buildingId;
      const descriptions = req.body['descriptions[]'] || req.body.descriptions || [];

      if (!buildingId || !req.files?.length) {
        return res.status(400).json({ success: false, message: 'Missing buildingId or images.' });
      }

      const descriptionList = Array.isArray(descriptions) ? descriptions : [descriptions];
      const bucket = storage.bucket(bucketName);
      const webpOptions = { quality: 80 };

      const uploadedImages = await Promise.all(
        req.files.map(async (file, index) => {
          const timestamp = Date.now();
          const originalName = path.parse(file.originalname).name.replace(/\s+/g, '-');
          const inputBuffer = await fs.readFile(file.path);

          const buffer1024 = await sharp(inputBuffer)
            .resize(1024, 1024)
            .webp(webpOptions)
            .toBuffer();

          const file1024Name = `assets/images/laik/large/${timestamp}.webp`;
          await bucket.file(file1024Name).save(buffer1024, {
            contentType: 'image/webp',
            resumable: false,
          });
          const url1024 = `https://storage.googleapis.com/${bucketName}/${file1024Name}`;

          const buffer200 = await sharp(buffer1024)
            .resize(200, 140)
            .webp(webpOptions)
            .toBuffer();

          const file200Name = `assets/images/laik/thumb/${timestamp}.webp`;
          await bucket.file(file200Name).save(buffer200, {
            contentType: 'image/webp',
            resumable: false,
          });
          const url200 = `https://storage.googleapis.com/${bucketName}/${file200Name}`;

          await fs.unlink(file.path);

          return {
            id: `${timestamp}`,
            title:originalName,
            description: descriptionList[index] || '',
            '1024x1024': url1024,
            '200x140': url200,
          };
        })
      );

      const existing = await BuildingAdditionalImages.findOne({ building_id: buildingId });

      if (existing) {
        existing.floor_plans.push(...uploadedImages);
        await existing.save();
      } else {
        await BuildingAdditionalImages.create({
          building_id: buildingId,
          floor_plans: uploadedImages,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Floor plan images uploaded, resized, and converted to WebP.',
        images: uploadedImages,
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
];


exports.updateImageStatus = async (req, res) => {
  const { building_id, updates } = req.body;

  if (!building_id || !Array.isArray(updates)) {
    return res.status(400).json({ success: false, message: 'Invalid request data' });
  }

  try {
    const building = await BuildingAdditionalImages.findOne({ building_id });

    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    let modified = false;

    updates.forEach(update => {
      const image = building.images.find(img => img._id.toString() === String(update.id));
      if (image && image.status !== update.status) {
        image.status = update.status;
        modified = true;
      }
    });

    if (modified) {
      building.markModified('images');
      await building.save();
      return res.status(200).json({ success: true, message: 'Image status updated successfully.' });
    } else {
      return res.status(200).json({ success: true, message: 'No changes were made.' });
    }

  } catch (err) {
    console.error('Error updating image statuses:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateFloorImageStatus = async (req, res) => {
  const { building_id, updates } = req.body;

  if (!building_id || !Array.isArray(updates)) {
    return res.status(400).json({ success: false, message: 'Invalid request data' });
  }

  try {
    const building = await BuildingAdditionalImages.findOne({ building_id });

    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    let modified = false;

    updates.forEach(update => {
      const floor_plans = building.floor_plans.find(img => img._id.toString() === String(update.id));
      if (floor_plans && floor_plans.status !== update.status) {
        floor_plans.status = update.status;
        modified = true;
      }
    });

    if (modified) {
      building.markModified('floor_plans');
      await building.save();
      return res.json({ success: true, message: 'Image status updated successfully.' });
    } else {
      return res.json({ success: true, message: 'No changes were made.' });
    }

  } catch (err) {
    console.error('Error updating image statuses:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.listImages = async (req, res) => {
  try {
    const buildingId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const doc = await BuildingAdditionalImages.findOne({ building_id: buildingId });

    if (!doc || !doc.images) {
      return res.status(200).json({ success: true, images: [], totalPages: 0, currentPage: 1 });
    }

    const totalImages = doc.images.length;
    const totalPages = Math.ceil(totalImages / limit);
    const paginatedImages = doc.images.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      images: paginatedImages,
      totalPages,
      currentPage: page
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listFloorImages = async (req, res) => {
  try {
    const buildingId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const doc = await BuildingAdditionalImages.findOne({ building_id: buildingId });

    if (!doc || !doc.images) {
      return res.status(200).json({ success: true, images: [], totalPages: 0, currentPage: 1 });
    }

    const totalImages = doc.floor_plans.length;
    const totalPages = Math.ceil(totalImages / limit);
    const paginatedImages = doc.floor_plans.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      images: paginatedImages,
      totalPages,
      currentPage: page
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.deleteImage = async (req, res) => {
  try {
    const imageId = req.params.imageId;
    const imageObjectId = new Types.ObjectId(imageId);

    const bucket = storage.bucket(bucketName);

    const buildingDoc = await BuildingAdditionalImages.findOne({ 'images._id': imageObjectId });

    if (!buildingDoc) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    const imageToDelete = buildingDoc.images.find(img => img._id.equals(imageObjectId));

    if (!imageToDelete) {
      return res.status(404).json({ success: false, message: 'Image not found in document.' });
    }

    const imageSizes = ['200x140', '520x280', '1024x1024', '2280x1800'];

    // Move all image sizes from laik → archive folder
    await Promise.all(imageSizes.map(async (size) => {
      const imageUrl = imageToDelete[size];
      if (imageUrl) {
        const fileName = path.basename(imageUrl.split("?")[0]); // Remove query params
        console.log("fileName",fileName);
        const srcFilePath = `assets/images/laik/${fileName}`;
        const destFilePath = `assets/images/property_archive/${fileName}`;

        const file = bucket.file(srcFilePath);
        await file.move(destFilePath); // Move file to archive
      }
    }));

    // Remove image entry from DB
    await BuildingAdditionalImages.updateOne(
      { 'images._id': imageObjectId },
      { $pull: { images: { _id: imageObjectId } } }
    );

    res.status(200).json({ success: true, message: 'Image archived and deleted successfully.' });

  } catch (err) {
    console.error('Error archiving image:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// exports.deleteMultipleImages = async (req, res) => {
//   try {
//     const { imageIds } = req.body;

//     if (!Array.isArray(imageIds) || imageIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No images selected." });
//     }

//     const objectIds = imageIds.map(id => new Types.ObjectId(id));

//     // Find all buildings with matching image IDs
//     const buildings = await BuildingAdditionalImages.find({ 'images._id': { $in: objectIds } });

//     if (!buildings || buildings.length === 0) {
//       return res.status(404).json({ success: false, message: "No matching images found." });
//     }

//     // Remove images from each building
//     await Promise.all(buildings.map(building => {
//       building.images = building.images.filter(img => !objectIds.some(oid => oid.equals(img._id)));
//       building.markModified("images");
//       return building.save();
//     }));

//     res.json({ success: true, message: "Selected images deleted successfully." });

//   } catch (err) {
//     console.error("Error deleting multiple images:", err);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// };


// exports.deleteMultipleImages = async (req, res) => {
//   try {
//     const { imageIds } = req.body;

//     if (!Array.isArray(imageIds) || imageIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No images selected." });
//     }

//     const objectIds = imageIds.map(id => new Types.ObjectId(id));
//     const bucket = storage.bucket(bucketName);
//     const imageSizes = ['200x140', '520x280', '1024x1024', '2280x1800'];

//     const buildings = await BuildingAdditionalImages.find({ 'images._id': { $in: objectIds } });

//     if (!buildings || buildings.length === 0) {
//       return res.status(404).json({ success: false, message: "No matching images found." });
//     }

//     // Loop through each building
//     for (const building of buildings) {
//       const remainingImages = [];

//       for (const image of building.images) {
//         if (objectIds.some(id => id.equals(image._id))) {
//           // Archive each image size
//           await Promise.all(imageSizes.map(async (size) => {
//             const imageUrl = image[size];
//             if (imageUrl) {
//               const fileName = path.basename(imageUrl.split("?")[0]);
//               console.log("fileName",fileName);
//               const srcFilePath = `assets/images/laik/${fileName}`;
//               const destFilePath = `assets/images/property_archive/${fileName}`;

//               try {
//                 const file = bucket.file(srcFilePath);
//                 await file.move(destFilePath);
//               } catch (err) {
//                 console.warn(`Failed to move file ${srcFilePath}: ${err.message}`);
//               }
//             }
//           }));
//         } else {
//           remainingImages.push(image);
//         }
//       }

//       building.images = remainingImages;
//       building.markModified("images");
//       await building.save();
//     }

//     res.status(200).json({ success: true, message: "Selected images archived and deleted successfully." });

//   } catch (err) {
//     console.error("Error deleting multiple images:", err);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// };


exports.deleteMultipleImages = async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ success: false, message: "No images selected." });
    }

    const objectIds = imageIds.map(id => new Types.ObjectId(id));
    const bucket = storage.bucket(bucketName);

    // Map size to subfolder
    const imageSizeDirs = {
      '200x140': 'thumb',
      '520x280': 'medium',
      '1024x1024': 'large',
      '2280x1800': 'xlarge'
    };

    const buildings = await BuildingAdditionalImages.find({ 'images._id': { $in: objectIds } });

    if (!buildings || buildings.length === 0) {
      return res.status(404).json({ success: false, message: "No matching images found." });
    }


    for (const building of buildings) {
      const remainingImages = [];

      for (const image of building.images) {
        if (objectIds.some(id => id.equals(image._id))) {
          await Promise.all(
            Object.entries(imageSizeDirs).map(async ([size, folder]) => {
              const imageUrl = image[size];
              if (imageUrl) {
                const fileName = path.basename(imageUrl.split("?")[0]);
                const srcFilePath = `assets/images/laik/${folder}/${fileName}`;
                const destFilePath = `assets/images/property_archive/${folder}/${fileName}`;

                try {
                  const file = bucket.file(srcFilePath);
                  await file.move(destFilePath);
                } catch (err) {
                  console.warn(`Failed to move file ${srcFilePath}: ${err.message}`);
                }
              }
            })
          );
        } else {
          remainingImages.push(image);
        }
      }

      building.images = remainingImages;
      building.markModified("images");
      await building.save();
    }

    res.status(200).json({ success: true, message: "Selected images archived and deleted successfully." });

  } catch (err) {
    console.error("Error deleting multiple images:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


// exports.deleteMultipleFloorPlans = async (req, res) => {
//   try {
//     const { imageIds } = req.body;

//     if (!Array.isArray(imageIds) || imageIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No floor plans selected." });
//     }

//     const objectIds = imageIds.map(id => new Types.ObjectId(id));
//     const bucket = storage.bucket(bucketName);
//     const imageSizes = ['200x140', '1024x1024']; // only these sizes are in floor_plans

//     const buildings = await BuildingAdditionalImages.find({ 'floor_plans._id': { $in: objectIds } });

//     if (!buildings || buildings.length === 0) {
//       return res.status(404).json({ success: false, message: "No matching floor plan images found." });
//     }

//     for (const building of buildings) {
//       const remainingFloorPlans = [];

//       for (const floor of building.floor_plans) {
//         if (objectIds.some(id => id.equals(floor._id))) {
//           // Archive each size variant
//           await Promise.all(imageSizes.map(async (size) => {
//             const imageUrl = floor[size];
//             if (imageUrl) {
//               const fileName = path.basename(imageUrl.split("?")[0]);
//               const srcFilePath = `assets/images/laik/${fileName}`;
//               const destFilePath = `assets/images/property_archive/${fileName}`;

//               try {
//                 const file = bucket.file(srcFilePath);
//                 await file.move(destFilePath);
//               } catch (err) {
//                 console.warn(`Failed to move file ${srcFilePath}: ${err.message}`);
//               }
//             }
//           }));
//         } else {
//           remainingFloorPlans.push(floor);
//         }
//       }

//       building.floor_plans = remainingFloorPlans;
//       building.markModified("floor_plans");
//       await building.save();
//     }

//     res.status(200).json({ success: true, message: "Selected floor plans archived and deleted successfully." });

//   } catch (err) {
//     console.error("Error deleting floor plans:", err);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// };



exports.deleteMultipleFloorPlans = async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ success: false, message: "No floor plans selected." });
    }

    const objectIds = imageIds.map(id => new Types.ObjectId(id));
    const bucket = storage.bucket(bucketName);

    // Only floor plans use these sizes
    const imageSizeDirs = {
      '200x140': 'thumb',
      '1024x1024': 'large'
    };

    const buildings = await BuildingAdditionalImages.find({ 'floor_plans._id': { $in: objectIds } });

    if (!buildings || buildings.length === 0) {
      return res.status(404).json({ success: false, message: "No matching floor plan images found." });
    }

    for (const building of buildings) {
      const remainingFloorPlans = [];

      for (const floor of building.floor_plans) {
        if (objectIds.some(id => id.equals(floor._id))) {
          // Archive each size variant
          await Promise.all(
            Object.entries(imageSizeDirs).map(async ([size, folder]) => {
              const imageUrl = floor[size];
              if (imageUrl) {
                const fileName = path.basename(imageUrl.split("?")[0]);
                const srcFilePath = `assets/images/laik/${folder}/${fileName}`;
                const destFilePath = `assets/images/property_archive/${folder}/${fileName}`;

                try {
                  const file = bucket.file(srcFilePath);
                  await file.move(destFilePath);
                } catch (err) {
                  console.warn(`Failed to move file ${srcFilePath}: ${err.message}`);
                }
              }
            })
          );
        } else {
          remainingFloorPlans.push(floor);
        }
      }

      building.floor_plans = remainingFloorPlans;
      building.markModified("floor_plans");
      await building.save();
    }

    res.status(200).json({ success: true, message: "Selected floor plans archived and deleted successfully." });

  } catch (err) {
    console.error("Error deleting floor plans:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};



exports.deleteFloorImage = async (req, res) => {
  try {
    const imageId = String(req.params.imageId); // ensure it's string

    // Find the document containing the image
    const buildingDoc = await BuildingAdditionalImages.findOne({ 'floor_plans.id': imageId });

    if (!buildingDoc) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    // Optional: delete files from disk if you manage local images
    // const imageToDelete = buildingDoc.floor_plans.find(img => img.id === imageId);
    // ...

    // Pull the floor plan entry
    const result = await BuildingAdditionalImages.updateOne(
      { 'floor_plans.id': imageId },
      { $pull: { floor_plans: { id: imageId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Image not deleted.' });
    }

    res.status(200).json({ success: true, message: 'Image deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProperty = async (req,res) => {
    try {
        const propertyId = req.params.id;
    
        const property = await Property.findById(propertyId);
        if (!property) {
          return res.status(404).json({ status: false, message: 'Building is not found' });
        }
    
        // // Delete image file if it exists
        // if (developer.image) {
        //   const imagePath = path.join(__dirname, '../public/uploads/developers', developer.image);
        //   if (fs.existsSync(imagePath)) {
        //     fs.unlinkSync(imagePath);
        //   }
        // }
    
        // Delete developer from DB
        await Property.findByIdAndDelete(propertyId);
    
        return res.status(200).json({ status: true, message: 'Building  deleted successfully' });
      } catch (error) {
        console.log('Delete developer error:', error);
        return res.status(500).json({ status: false, message: error.message });
      }
}


exports.setDefaultImge = async (req,res) => {
  const { propertyId, imageId,buildingId } = req.body;

  if (!propertyId || !imageId) {
    return res.status(400).json({status: false, message: 'propertyId and imageId are required.' });
  }

  try {
    const additionalImagesDoc = await BuildingAdditionalImages.findOne({ building_id: buildingId });

    if (!additionalImagesDoc) {
      return res.status(404).json({status: false, message: 'Additional images not found for this property.' });
    }

    const updatedImages = additionalImagesDoc.images.map(img => ({
      ...img.toObject(),
      isDefault: img._id.toString() === imageId
    }));
    additionalImagesDoc.images = updatedImages;
    await additionalImagesDoc.save();

    const defaultImage = updatedImages.find(img => img._id.toString() === imageId);

    await Property.findByIdAndUpdate(propertyId, {
      default_image: defaultImage
    });

    res.status(200).json({status: true, message: 'Default image set successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({status: false, message: err.message });
  }
}

// exports.updateImageInfo = async (req,res) => {
//   const { imageId, title, description } = req.body;

//   if (!imageId || !title || !description) {
//     return res.status(400).json({
//       success: false,
//       message: "All fields (imageId, title, description) are required",
//     });
//   }

//   try {
//     const result = await Image.updateOne(
//       { _id: imageId },
//       { $set: { title, description } }
//     );

//     if (result.modifiedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Image not found or no changes made",
//       });
//     }

//     return res.status(200).json({ success: true, message: "Image updated successfully" });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// }

exports.updateImageInfo = async (req, res) => {
  const { buildingId, imageId, title, description } = req.body;

  if (!buildingId || !imageId || !title || !description) {
    return res.status(400).json({
      success: false,
      message: 'buildingId, imageId, title, and description are required.'
    });
  }

  try {
    const updatedDoc = await BuildingAdditionalImages.findOneAndUpdate(
      {
        building_id: buildingId,
        'images._id': imageId
      },
      {
        $set: {
          'images.$.title': title,
          'images.$.description': description
        }
      },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        message: 'Image not found for the given building.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image info updated successfully.',
      data: updatedDoc
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateImageFloorInfo = async (req, res) => {
  const { buildingId, imageId, title, description } = req.body;

  if (!buildingId || !imageId || !title || !description) {
    return res.status(400).json({
      success: false,
      message: 'buildingId, imageId, title, and description are required.'
    });
  }

  try {
    const updatedDoc = await BuildingAdditionalImages.findOneAndUpdate(
      {
        building_id: buildingId,
        'floor_plans._id': imageId
      },
      {
        $set: {
          'floor_plans.$.title': title,
          'floor_plans.$.description': description
        }
      },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        message: 'floor plans Image not found for the given building.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'floor plans Image info updated successfully.',
      data: updatedDoc
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


