const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: {
    _id: mongoose.Schema.Types.ObjectId,
    label: String
  },
  desc: String,
  popular: Boolean,
  sizeInfo: String,
  materialInfo: String,
  terms: String, 
  images: [
    {
      url: {
        type: String
      },
      isMain: Boolean
    },
  ],
});

module.exports = mongoose.model('Product', ProductSchema);