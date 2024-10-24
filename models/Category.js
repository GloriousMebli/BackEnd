const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  label: String,
});

module.exports = mongoose.model('category', CategorySchema);