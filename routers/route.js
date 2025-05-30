var express = require('express');
var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: false });
var validator = require('express-validator');
const propertiesController = require('../controllers/properties');

const authenticateJWT = require("../middleware/authenticateJwt");
const authorizeRoles = require('../middleware/authorizeRoles ');

module.exports = function (app) {

      function isUserAllowed(req, res, next) {
            sess = req.session;
            if (sess.developer_id) {
                  return next();
            } else {
                   res.redirect('/login'); 
            }
      }

      // Laik routes
      app.get('/', isUserAllowed,authenticateJWT,authorizeRoles('developer'), function (req, res) {
            res.locals = { title: 'Dashboard' };
            res.render('Dashboard/index');
      });

      // Buildings
      app.get('/building-list', isUserAllowed,authenticateJWT,authorizeRoles('developer'), function (req, res) {
            const developerId = req.user._id;
            res.locals = { title: 'Building Lists' };
            res.render('Building/building-list',{developerId});
      });

      app.get('/properties/data',isUserAllowed,authenticateJWT,authorizeRoles('developer'),propertiesController.properties);

      app.get('/addEditProperty',isUserAllowed, authenticateJWT,authorizeRoles('developer'), propertiesController.editProperties);

      app.post('/addProperty', authenticateJWT, authorizeRoles('developer'), propertiesController.addProperties);

      app.put('/updateProperty/:id', authenticateJWT, authorizeRoles('developer'), propertiesController.updateProperties);

      app.delete('/deleteProperty/:id', authenticateJWT, authorizeRoles('developer'), propertiesController.deleteProperty);


      

      app.post('/upload-property-image', authenticateJWT, authorizeRoles('developer'), propertiesController.uploadPropertyImages);

      app.get('/viewPropertyImages', authenticateJWT, authorizeRoles('developer'), propertiesController.viewUploadPropertyImage);

      // Get images by building ID
      app.get('/list-images/:id',authenticateJWT, authorizeRoles('developer'), propertiesController.listImages);

      // Delete an image by ID
      app.delete('/delete-property-image/:imageId',authenticateJWT, authorizeRoles('developer'), propertiesController.deleteImage);

      app.delete('/delete-multiple-images', authenticateJWT, authorizeRoles('developer'),propertiesController.deleteMultipleImages);


      app.put('/update-image-status',authenticateJWT, authorizeRoles('developer'), propertiesController.updateImageStatus);

      app.post('/setDefaultImge',authenticateJWT, authorizeRoles('developer'), propertiesController.setDefaultImge);

      app.post('/updateImageInfo',authenticateJWT, authorizeRoles('developer'), propertiesController.updateImageInfo);


      //Floor images
      app.post('/upload-property-floor-image', authenticateJWT, authorizeRoles('developer'), propertiesController.uploadPropertyFloorImages);

      app.get('/viewPropertyFloorImages', authenticateJWT, authorizeRoles('developer'), propertiesController.viewUploadPropertyFloorImage);

      // Get images by building ID
      app.get('/list-floor-images/:id',authenticateJWT, authorizeRoles('developer'), propertiesController.listFloorImages);

      // Delete an floor image by ID
      app.delete('/delete-property-floor-image/:imageId',authenticateJWT, authorizeRoles('developer'), propertiesController.deleteFloorImage);

       app.delete('/delete-multiple-floor-images', authenticateJWT, authorizeRoles('developer'),propertiesController.deleteMultipleFloorPlans);


      app.put('/update-floor-image-status',authenticateJWT, authorizeRoles('developer'), propertiesController.updateFloorImageStatus);

       app.post('/updateImageFloorInfo',authenticateJWT, authorizeRoles('developer'), propertiesController.updateImageFloorInfo);
      
      app.get('/building-edit', isUserAllowed, function (req, res) {
            res.locals = { title: 'Building Edit' };
            res.render('Building/edit-building');
      });

      // Developers
      app.get('/developers-list', isUserAllowed, function (req, res) {
            res.locals = { title: 'Developers List' };
            res.render('Developers/developers-list');
      });

      app.get('/add-developers', isUserAllowed, function (req, res) {
            res.locals = { title: 'Add New Developer' };
            res.render('Developers/add-edit-developers');
      });

      app.get('/edit-developers', isUserAllowed, function (req, res) {
            res.locals = { title: 'Edit Developer' };
            res.render('Developers/add-edit-developers');
      });

      // My profile
      app.get('/my-profile', isUserAllowed, function (req, res) {
            res.locals = { title: 'My Profile' };
            res.render('Profile/my-profile');
      });


      

      // Layouts
      app.get('/layouts-horizontal', isUserAllowed, function (req, res) {
            res.locals = { title: 'Horizontal' };
            res.render('Dashboard/index', { layout: 'layoutsHorizontal' });
      });
      
      app.get('/layouts-light-sidebar', isUserAllowed, function (req, res) {
            res.locals = { title: 'Light Sidebar' };
            res.render('Dashboard/index', { layout: 'layoutsLightSidebar' });
      });
      app.get('/layouts-compact-sidebar', isUserAllowed, function (req, res) {
            res.locals = { title: 'Compact Sidebar' };
            res.render('Dashboard/index', { layout: 'layoutsCompactSidebar' });
      });
      app.get('/layouts-icon-sidebar', isUserAllowed, function (req, res) {
            res.locals = { title: 'Icon Sidebar' };
            res.render('Dashboard/index', { layout: 'layoutsIconSidebar' });
      });
      app.get('/layouts-boxed', isUserAllowed, function (req, res) {
            res.locals = { title: 'Boxed Width' };
            res.render('Dashboard/index', { layout: 'layoutsBoxed' });
      });
      app.get('/layouts-colored-sidebar', isUserAllowed, function (req, res) {
            res.locals = { title: 'Colored Sidebar' };
            res.render('Dashboard/index', { layout: 'layoutsColoredSidebar' });
      });

      app.get('/layouts-h-boxed', isUserAllowed, function (req, res) {
            res.locals = { title: 'Boxed Width' };
            res.render('Dashboard/index', { layout: 'layoutsHBoxed' });
      });
      app.get('/layouts-h-topbar-light', isUserAllowed, function (req, res) {
            res.locals = { title: 'Topbar Light' };
            res.render('Dashboard/index', { layout: 'layoutsHTopbarLight' });
      });

      // Color Theme vertical
      app.get("/vertical-dark", isUserAllowed, function (req, res) {
            res.locals = { title: 'Vertical Dark' };
            res.render("Dashboard/index", { layout: "vertical-dark-layout" });
      });
      
      app.get("/vertical-rtl", isUserAllowed, function (req, res) {
            res.locals = { title: 'Vertical Rtl' };
            res.render("Dashboard/index", { layout: "vertical-rtl-layout" });
      });
      
      // Color Theme Horizontal
      app.get("/horizontal-dark", isUserAllowed, function (req, res) {
            res.locals = { title: 'Horizontal Dark' };
            res.render("Dashboard/index", { layout: "horizontal-dark-layout" });
      });
      
      app.get("/horizontal-rtl", isUserAllowed, function (req, res) {
            res.locals = { title: 'Horizontal Rtl' };
            res.render("Dashboard/index", { layout: "horizontal-rtl-layout" });
      });

      
      // Calendar
      app.get('/calendar', isUserAllowed, function (req, res) {
            res.locals = { title: 'Calendar' };
            res.render('Calendar/calendar');
      });

      // Forms
      app.get('/form-elements', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Elements' };
            res.render('Form/form-elements');
      });
      app.get('/form-validation', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Validation' };
            res.render('Form/form-validation');
      });
      app.get('/form-advanced', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Advanced' };
            res.render('Form/form-advanced');
      });
      app.get('/form-wizard', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Wizard' };
            res.render('Form/form-wizard');
      });
      app.get('/form-editors', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Editors' };
            res.render('Form/form-editors');
      });
      app.get('/form-uploads', isUserAllowed, function (req, res) {
            res.locals = { title: 'File Uploads' };
            res.render('Form/form-uploads');
      });
      app.get('/form-mask', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Mask' };
            res.render('Form/form-mask');
      });
      app.get('/form-xeditable', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Xeditable' };
            res.render('Form/form-xeditable');
      });
      
      // Charts
      app.get('/charts-morris', isUserAllowed, function (req, res) {
            res.locals = { title: 'Morris Chart' };
            res.render('Charts/charts-morris');
      });
      app.get('/charts-chartist', isUserAllowed, function (req, res) {
            res.locals = { title: 'Chartist Chart' };
            res.render('Charts/charts-chartist');
      });
      app.get('/charts-chartjs', isUserAllowed, function (req, res) {
            res.locals = { title: 'Chartjs Chart' };
            res.render('Charts/charts-chartjs');
      });
      app.get('/charts-flot', isUserAllowed, function (req, res) {
            res.locals = { title: 'Flot Chart' };
            res.render('Charts/charts-flot');
      });
      app.get('/charts-c3', isUserAllowed, function (req, res) {
            res.locals = { title: 'C3 Chart' };
            res.render('Charts/charts-c3');
      });
      app.get('/charts-sparkline', isUserAllowed, function (req, res) {
            res.locals = { title: 'Sparkline Chart' };
            res.render('Charts/charts-sparkline');
      });
      app.get('/charts-other', isUserAllowed, function (req, res) {
            res.locals = { title: 'Jquery Knob Chart' };
            res.render('Charts/charts-other');
      });
      app.get('/charts-peity', isUserAllowed, function (req, res) {
            res.locals = { title: 'Peity Chart' };
            res.render('Charts/charts-peity');
      });

      
}