require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var usersRouter = require('./routes/users');
var tweetsRouter = require('./routes/tweets');

var app = express();

const cors = require('cors');

// Define allowed origins
const allowedOrigins = [
  'https://simple-js-site-frontend-l99dw46r6-elenas-projects-5db2dcf4.vercel.app',
  'https://novatweet.com',
  'https://simple-js-site-frontend.vercel.app'
];

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Check if the origin is in the allowed origins array
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization'
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/tweets', tweetsRouter);

module.exports = app;
