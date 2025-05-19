var express = require('express');
var bodyParser = require('body-parser');
const BackendUserLogin = require("../models/BackendUserLogin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
var urlencodeParser = bodyParser.urlencoded({ extended: false });

var validator = require('express-validator');

var axios = require("axios");
var MockAdapter = require("axios-mock-adapter");

// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);

let users = [
	{ id: 1, username: 'developer', password: '123456', email: 'developer@laik.com.br' }
];

// Mock GET request to /users when param `searchText` is 'John'
mock.onGet("/users", { params: { searchText: "John" } }).reply(200, {
	users: users,
});

module.exports = function (app) {

	// Inner Auth
	app.get('/pages-login', function (req, res) {
		res.locals = { title: 'Login' };
		res.render('AuthInner/pages-login');
	});
	app.get('/pages-register', function (req, res) {
		res.locals = { title: 'Register' };
		res.render('AuthInner/pages-register');
	});
	app.get('/pages-recoverpw', function (req, res) {
		res.locals = { title: 'Recover Password' };
		res.render('AuthInner/pages-recoverpw');
	});
	app.get('/pages-lock-screen', function (req, res) {
		res.locals = { title: 'Lock Screen' };
		res.render('AuthInner/pages-lock-screen');
	});
	app.get('/pages-login-2', function (req, res) {
		res.locals = { title: 'Login 2' };
		res.render('AuthInner/pages-login-2');
	});
	app.get('/pages-register-2', function (req, res) {
		res.locals = { title: 'Register 2' };
		res.render('AuthInner/pages-register-2');
	});
	app.get('/pages-recoverpw-2', function (req, res) {
		res.locals = { title: 'Recover Password 2' };
		res.render('AuthInner/pages-recoverpw-2');
	});
	app.get('/pages-lock-screen-2', function (req, res) {
		res.locals = { title: 'Lock Screen 2' };
		res.render('AuthInner/pages-lock-screen-2');
	});


	// Auth Pages

	app.get('/pages-maintenance', function (req, res) {
		res.locals = { title: 'Pages Maintenance' };
		res.render('Pages/pages-maintenance');
	});
	app.get('/pages-coming-soon', function (req, res) {
		res.locals = { title: 'Pages Comingsoon' };
		res.render('Pages/pages-coming-soon');
	});


	app.get('/register', function (req, res) {
		if (req.user) { res.redirect('Dashboard/index'); }
		else {
			res.render('Auth/auth-register', { 'message': req.flash('message'), 'error': req.flash('error') });
		}
	});

	app.post('/post-register', urlencodeParser, function (req, res) {
		let tempUser = { username: req.body.username, email: req.body.email, password: req.body.password };
		users.push(tempUser);

		// Assign value in session
		sess = req.session;
		sess.user = tempUser;

		res.redirect('/');
	});


	app.get('/login', function (req, res) {
		res.render('Auth/auth-login', { 'message': req.flash('message'), 'error': req.flash('error') });
	});

	app.post('/post-login', urlencodeParser, async function (req, res) {
		const email= req.body.email;
		const password= req.body.password;
		console.log("email",email,"password",password);
	
		if (!email || !password) {
			return res.render('Auth/auth-login', { message: 'All fields are required', error:"All fields are required" });
		}
	
		try {
			//Check if user exists
			const user = await BackendUserLogin.findOne({ email, role: 'developer' });
			console.log("user",user);
	
			if (!user) {
				return res.json({ status: 'error', message: 'Invalid credentials' })
			}
	
			// Check password
			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				return res.json({ status: 'error', message: 'Invalid credentials' })
	
			}
	
			// Set session
			req.session.developer_id = user._id;
			const token = jwt.sign(
				{ developerId: user._id },
					process.env.TOKEN_KEY,
				{
				  expiresIn: process.env.TOKEN_EXPIRY || '1h',
				}
			  );
			//res.cookie("token", token);
			res.cookie('developer_token',token,{
				maxAge: 1 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
				httpOnly:true,
				secure:false
			})
			res.json({ status: 'success', header: 'brokers', message: ` Successfull`})
			//res.redirect('/dashboard');
		} catch (err) {
			console.error(err);
			res.json({ status: 'error', message: 'Something test went wrong' })
	
			//res.render('login', { error: 'Something test went wrong' });
		}
	});

	app.get('/forgot-password', function (req, res) {
		res.render('Auth/auth-forgot-password', { 'message': req.flash('message'), 'error': req.flash('error') });
	});

	app.post('/post-forgot-password', urlencodeParser, function (req, res) {
		const validUser = users.filter(usr => usr.email === req.body.email);
		if (validUser['length'] === 1) {
			req.flash('message', 'We have e-mailed your password reset link!');
			res.redirect('/forgot-password');
		} else {
			req.flash('error', 'Email Not Found !!');
			res.redirect('/forgot-password');
		}
	});

	app.get('/logout', function (req, res) {
		res.clearCookie("developer_token");
    	req.session.destroy((err) => {
			if (err) {
				console.error("Error destroying session:", err);
				return res.redirect('/login');
			}
			res.redirect('/login');
			});
	});


};