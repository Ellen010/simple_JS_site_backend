const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Tweet = require('../models/tweets');
const { checkBody } = require('../modules/checkBody');

router.post('/', (req, res) => {
  if (!checkBody(req.body, ['token', 'content'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    const newTweet = new Tweet({
      author: user._id,
      content: req.body.content,
      createdAt: new Date(),
    });

    newTweet.save().then(newDoc => {
      res.json({ result: true, tweet: newDoc });
    });
  });
});

router.get('/all/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    Tweet.find()
      .populate('author', ['username', 'firstName'])
      .populate('likes', ['username'])
      .sort({ createdAt: 'desc' })
      .then(tweets => {
        res.json({ result: true, tweets });
      });
  });
});

router.get('/trends/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    Tweet.find({ content: { $regex: /#/ } })
      .then(tweets => {
        const hashtags = [];

        for (const tweet of tweets) {
          const filteredHashtags = tweet.content.split(' ').filter(word => word.startsWith('#') && word.length > 1);
          hashtags.push(...filteredHashtags);
        }

        const trends = [];
        for (const hashtag of hashtags) {
          const trendIndex = trends.findIndex(trend => trend.hashtag === hashtag);
          if (trendIndex === -1) {
            trends.push({ hashtag, count: 1 });
          } else {
            trends[trendIndex].count++;
          }
        }

        res.json({ result: true, trends: trends.sort((a, b) => b.count - a.count) });
      });
  });
});

router.get('/hashtag/:token/:query', (req, res) => {
  User.findOne({ token: req.params.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    Tweet.find({ content: { $regex: new RegExp('#' + req.params.query, 'i') } }) 
      .populate('author', ['username', 'firstName'])
      .populate('likes', ['username'])
      .sort({ createdAt: 'desc' })
      .then(tweets => {
        res.json({ result: true, tweets });
      });
  });
});

router.put('/like', (req, res) => {
  if (!checkBody(req.body, ['token', 'tweetId'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    Tweet.findById(req.body.tweetId).then(tweet => {
      if (!tweet) {
        res.json({ result: false, error: 'Tweet not found' });
        return;
      }

      if (tweet.likes.includes(user._id)) {
        Tweet.updateOne({ _id: tweet._id }, { $pull: { likes: user._id } }) 
          .then(() => {
            res.json({ result: true });
          });
      } else {
        Tweet.updateOne({ _id: tweet._id }, { $push: { likes: user._id } })
          .then(() => {
            res.json({ result: true });
          });
      }
    });
  });
});

router.delete('/', (req, res) => {
  if (!checkBody(req.body, ['token', 'tweetId'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    Tweet.findById(req.body.tweetId)
      .populate('author')
      .then(tweet => {
        if (!tweet) {
          res.json({ result: false, error: 'Tweet not found' });
          return;
        } else if (String(tweet.author._id) !== String(user._id)) { 
          res.json({ result: false, error: 'Tweet can only be deleted by its author' });
          return;
        }

        Tweet.deleteOne({ _id: tweet._id }).then(() => {
          res.json({ result: true });
        });
      });
  });
});

module.exports = router;
