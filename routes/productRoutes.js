const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const authenticate = require('../middlewares/authMiddleware');
const {uploadImage, deleteImage } = require('../functions/upload'); // Adjust the path if needed
const config = require('../config/bb');
const storage = multer.memoryStorage(); // Use memory storage to store files in memory
const upload = multer({ storage }); // Set multer to use this storage
const router = express.Router();

// Create Product
router.post('', authenticate, async (req, res) => {
  const payload = req.body;

  try {
    const product = new Product(payload);
    await product.save();
    res.status(201).json({ message: 'Product created', data: product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Products
router.get('', async (req, res) => {
  try {
    const query = req.query;
    const criteria = {}

    if (query?.categoryIds?.length) {
      criteria['category._id'] = {$in: query.categoryIds.split(',')}
    }

    if (query.popular) {
      criteria.popular = true;
    }

    if (query.withNameAndImage === 'true') {
      criteria.name = { $ne: null };
      criteria.images = { $ne: [] };
    }

    const products = await Product.find(criteria)
    products.sort(() => Math.random() - 0.5);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Product
router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const product = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Product
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Product Image
router.post('/:id/image', authenticate, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const isMain = req.body.isMain === 'true';

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let maxRetries = 5 
    let retries = 0
    let err
    let data

    while (retries < maxRetries) {
      const uploadResult = await uploadImage(req.file.buffer, req.file.originalname);

      err = uploadResult.err
      data = uploadResult.result

      if (!err) {
        retries = maxRetries + 1
      }
      if(err){
        console.log(err)
      }
      retries++
    }

    if(err){
      return { err }
    }
    const publicUrl = config.publicUrl + data?.response?.data?.fileName;
    const thumbnailUrl = config.publicUrl + data?.thumbnailResponse?.data?.fileName;

    const imageInfo = {
      url: publicUrl,
      thumbnailUrl: thumbnailUrl,
      isMain,
      meta: {
        fileId: data?.response?.data?.fileId,
        thumbnailFileId: data?.thumbnailResponse?.data?.fileId,
        fileName: data?.response?.data?.fileName,
        thumbnailFileName: data?.thumbnailResponse?.data?.fileName
      }
    };

    product.images.push(imageInfo);
    await product.save();

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:id/image/:imageId', authenticate, upload.single('file'), async (req, res) => {
  const { id, imageId } = req.params;
  try {
    let product = await Product.findById(id).lean(true);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const currentImage = product.images.find((image) => image._id.equals(imageId));

    await deleteImage(currentImage.meta)

    product.images = product.images.filter((image) => !image._id.equals(imageId));

    await Product.updateOne({ _id: id }, { $set: { images: product.images } });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
