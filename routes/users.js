var express = require('express');
var cors = require('cors');
var app = express();
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

// Apply CORS middleware
app.use(cors({
  origin: 'https://novatweet-frontend.vercel.app',
  methods: 'GET, POST, PUT, DELETE',
  allowedHeaders: 'Content-Type, Authorization'
}));

// Body parser middleware to handle JSON requests
app.use(express.json());

// Signup route
router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['firstName', 'username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ username: { $regex: new RegExp(req.body.username, 'i') } }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        firstName: req.body.firstName,
        username: req.body.username,
        password: hash,
        token: uid2(32),
        canBookmark: true,
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

// Signin route
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ username: { $regex: new RegExp(req.body.username, 'i') } }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, username: data.username, firstName: data.firstName });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

// Use the router
app.use('/users', router);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
