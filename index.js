require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const methodOverride = require('method-override');
const cors = require('cors');
const User = require('./user');

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json'
	);
	next();
});

// CONNECTION
const mongoose = require('mongoose');

const connectionString = process.env.DB_URL;

console.log('connection string', connectionString);

mongoose.connect(connectionString, {
	useNewUrlParser: true,
	// useUnifiedTopology: true,
	useFindAndModify: false
});

mongoose.connection.on('connected', () => {
	console.log(`connected to database`);
});

mongoose.connection.on('disconnected', () => {
	console.log(`disconnected from database`);
});

mongoose.connection.on('error', (err) => {
	console.log(`error with database connection:`);
	console.log(err);
});

// CORS
app.use(
	cors({
		// origin: '*',
		origin: [ 'http://localhost:3000', 'https://c-auth.herokuapp.com' ],
		credentials: true
	})
);

// BODY PARSER
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// METHOD OVERRIDE
app.use(methodOverride('_method'));

// SESSIONS
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true
	});

app.use(passport.initialize());
app.use(passport.session());

// ROUTES

// REGISTER
app.post('/register', async (req, res, next) => {
	const desiredUsername = req.body.username;
	const desiredPassword = req.body.password;
	const userWithThisUsername = await User.findOne({
		username: desiredUsername
	});
	console.log(userWithThisUsername);
	if (userWithThisUsername) {
		req.session.message = `Username ${desiredUsername} already taken.`;
		console.log('exists', req.session);
	} else {
		// console.log('not found one')
		// console.log('we are in register - res - CHECK', res)
		const createdUser = await User.create({
			username: desiredUsername,
			password: desiredPassword
		});
		req.session.loggedIn = true;
		req.session.userId = createdUser._id;
		req.session.username = createdUser.username;
		req.session.message = 'Thank you for signing up, ' + createdUser.username + '.';
		// console.log('successful sess', req.session)
		console.log('successful registration');
		res.send(req.session);
	}
});

// LOGIN
app.post('/login', async (req, res, next) => {
	console.log('we are logging in', req.body);
	const user = await User.findOne({ username: req.body.username });
	if (!user) {
		req.session.message = 'Invalid username or password.';
	} else {
		if (user.password == req.body.password) {
			req.session.loggedIn = true;
			req.session.userId = user._id;
			req.session.username = user.username;
			req.session.message = 'Welcome back, ' + user.username + '.';
			res.send(req.session);
		} else {
			req.session.message = 'Invalid username or password.';
		}
	}
});

// GET USER
app.get('/getUser', (req, res) => res.send(req.session));

// ==============================
//				 PORT SERVER
// ==============================
app.set('port', process.env.PORT || 8080);

app.listen(app.get('port'), () => {
	console.log(`✅ PORT: ${app.get('port')} 🌟`);
});
