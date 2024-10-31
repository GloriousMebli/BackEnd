const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  price: String,
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
      thumbnailUrl: {
        type: String
      },
      isMain: Boolean,
      meta:{
        fileId: String,
        fileName: String,
        thumbnailFileId: String,
        thumbnailFileName: String
      }
    },
  ],
});

module.exports = mongoose.model('Product', ProductSchema);