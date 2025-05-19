var app = require('express')();

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
var express = require('express');
var path = require('path');
var http = require('http').Server(app);
var validator = require('express-validator');

const cookieParser = require("cookie-parser");

// import controller
var AuthController = require('./controllers/AuthController');

// import Router file
var pageRouter = require('./routers/route');

var session = require('express-session');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var i18n = require("i18n-express");
app.use(bodyParser.json());
var urlencodeParser = bodyParser.urlencoded({ extended: true });


app.use(cors());
app.use(express.json());

dotenv.config({ path: "./.env" });

app.use(cookieParser());


// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.use(session({
  key: 'user_sid',
  secret: 'somerandonstuffsi&',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 18000000, // 5 hours in milliseconds
    httpOnly: true,
    sameSite: true
  }
}));

app.use(session({ resave: false, saveUninitialized: true, secret: 'nodedemo' }));
app.use(flash());
app.use(i18n({
  translationsPath: path.join(__dirname, 'i18n'), // <--- use here. Specify translations files path.
  siteLangs: ["es", "en", "de", "ru", "it", "fr"],
  textsVarName: 'translation'
}));

app.use('/public', express.static('public'));

app.get('/layouts/', function (req, res) {
  res.render('view');
});

// apply controller
AuthController(app);

//For set layouts of html view
var expressLayouts = require('express-ejs-layouts');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Define All Route 
pageRouter(app);

app.get('/', function (req, res) {
  res.redirect('/');
});

http.listen(3001, function () {
  console.log('listening on *:3001');
});
