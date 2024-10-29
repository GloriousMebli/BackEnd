const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const authenticate = require('../middlewares/authMiddleware');
const uploadImage = require('../functions/upload'); // Adjust path if needed

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Create Category
router.post('', authenticate, async (req, res) => {
  const payload = req.body;

  try {
    const category = new Category(payload);
    await category.save();
    res.status(201).json({ message: 'Category created', data: category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Categories
router.get('', async (req, res) => {
  try {
    const { category } = req.query;
    let criteria = category ? { category } : {};

    const categories = await Category.find(criteria);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Category
router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.label) {
    await Product.updateMany({ 'category._id': id }, { $set: { 'category.label': updates.label } });
  }

  try {
    const category = await Category.findByIdAndUpdate(id, { $set: updates }, { new: true });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Category
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findByIdAndDelete(id);
    await Product.updateMany({ 'category._id': id }, { $set: { category: null } });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
