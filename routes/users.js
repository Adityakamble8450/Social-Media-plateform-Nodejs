const mongoose = require('mongoose');
const pls = require('passport-local-mongoose');

const mongoURI = 'mongodb://localhost:27017/Social_media';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const userscema = new mongoose.Schema({
  username: {
    type: String,
    required: true,

  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,

  },
  contact: {
    type: Number,
    required: true

  },
  password: {
    type: String
  },

  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'

  }],
  dp: {
    type: String, // Assuming dp is a URL to the profile picture
    default: "def.png"

  },

});

userscema.plugin(pls);
module.exports = mongoose.model('User', userscema);