const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const authenticate = require('../middlewares/authMiddleware');
const {uploadImage, deleteImage, backBlazeInit } = require('../functions/upload'); // Adjust the path if needed
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

router.get('', async (req, res) => {
  try {
    const query = req.query;
    const criteria = {};

    // Фільтрація за категоріями
    if (query?.categoryIds?.length) {
      criteria['category._id'] = { $in: query.categoryIds.split(',') };
    }

    // Фільтрація за популярністю
    if (query.popular) {
      criteria.popular = true;
    }

    // Фільтрація за наявністю імені та зображень
    if (query.withNameAndImage === 'true') {
      criteria.name = { $ne: null };
      criteria.images = { $ne: [] };
    }

    // Отримання даних
    let products = await Product.find(criteria);
    
    // Якщо продукти не знайдені, вивести помилку
    if (!products) {
      return res.status(404).json({ error: 'No products found' });
    }

    // Обробка ціни перед сортуванням
    if (query.sortBy === 'price') {
      products = products.map((product) => {
        // Ensure price exists and is a string before calling replace
        let numericPrice = NaN;
        if (product.price && typeof product.price === 'string') {
          numericPrice = parseFloat(product.price.replace(/\s|грн|ГРН|Грн|UAH|uah|Uah|\$|₴/g, ''));
        }
        return { ...product.toObject(), numericPrice };
      });

      products.sort((a, b) => {
        const order = query.order === 'desc' ? -1 : 1;
        return order * (a.numericPrice - b.numericPrice);
      });
    } else if (query.sortBy === 'createdAt') {
      const order = query.order === 'desc' ? -1 : 1;
      products.sort((a, b) => order * (new Date(a.createdAt) - new Date(b.createdAt)));
    }

    // Відправка відфільтрованих та відсортованих продуктів
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
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
    let data
    let delay = 1000; // Start with 1 second delay

    while (retries < maxRetries) {
      try {
        const uploadResult = await uploadImage(req.file.buffer, req.file.originalname);

        if (!uploadResult.err) {
          data = uploadResult.result;
          break; // Exit loop if upload succeeds
        }
        throw uploadResult.err;

      } catch (err) {
        retries++;
        if(retries === 3){
          await backBlazeInit()
        }
        console.log(`Retry ${retries}:`, err);
        if (retries === maxRetries) {
          return res.status(500).json({ message: 'Failed to upload image after multiple attempts' });
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Double the delay for each retry (exponential backoff)
      }
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
