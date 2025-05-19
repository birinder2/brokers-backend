var express = require('express');
var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: false });
var validator = require('express-validator');
//const propertiesController = require('../controllers/properties');
const appointmentController = require('../controllers/appointment');

const authenticateJWT = require("../middleware/authenticateJwt");
const authorizeRoles = require('../middleware/authorizeRoles ');

module.exports = function (app) {

      function isUserAllowed(req, res, next) {
            sess = req.session;
            if (sess.broker_id) {
                  return next();
            } else {
                   res.redirect('/login'); 
            }
      }

      // Laik routes
      app.get('/', isUserAllowed,authenticateJWT,authorizeRoles('salesman'), function (req, res) {
            res.locals = { title: 'Dashboard' };
            res.render('Dashboard/index');
      });

      // Buildings
      app.get('/building-list', isUserAllowed,authenticateJWT,authorizeRoles('salesman'), function (req, res) {
            const developerId = req.user._id;
            res.locals = { title: 'Building Lists' };
            res.render('Building/building-list',{developerId});
      });

     
      
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

      // Bookings - Scheduled Visits - Appointments
      app.get('/scheduledVisits', isUserAllowed, authenticateJWT, authorizeRoles('salesman'), appointmentController.viewAppointments);
      app.get('/appointments/data',authenticateJWT,authorizeRoles('salesman'),appointmentController.getAppointments);
      app.get('/broker/:id',authenticateJWT,authorizeRoles('salesman'),appointmentController.getSalesmen);

      app.get('/scheduledVisitsList', isUserAllowed, authenticateJWT, authorizeRoles('salesman'), appointmentController.viewAppointmentsList);


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