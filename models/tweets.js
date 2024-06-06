const mongoose = require('mongoose');

const tweetSchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  content: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  createdAt: Date,
});

const Tweet = mongoose.model('tweets', tweetSchema);

module.exports = Tweet;
