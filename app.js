
require('dotenv').config({ override: true });
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
//app.listen(3000);

const admin = require('firebase-admin');
let apiKey = process.env.firebase_apiKey;
let authDomain = process.env.firebase_authDomain;
let databaseURL = process.env.firebase_databaseURL;
let projectId = process.env.firebase_projectId;
let storageBucket = process.env.firebase_storageBucket;
let messagingSenderId = process.env.firebase_messagingSenderId;
let appId = process.env.firebase_appId
let measurementId = process.env.firebase_measurementId;


const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId

};
let firebase_admin_json = process.env.firebase_admin_json;
var serviceAccount = JSON.parse(firebase_admin_json)
// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // The database URL depends on the location of the database
  databaseURL: databaseURL
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
const ref = db.ref();

// Add the reference to real time database as middleware to the app.
app.use((req, res, next) => {
  req.refdb = ref;
  next();
});

app.use('/users', usersRouter);

module.exports = app;
