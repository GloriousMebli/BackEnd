const Category = require('../models/Category');
const Product = require('../models/Product');

const authenticate = require('../middlewares/authMiddleware');
const uploadImage = require('../functions/upload'); // Make sure to adjust the path

const multer = require('multer');

const upload = multer({ dest: 'uploads/' }); 

module.exports = [
  {
    method: 'POST',
    path: '/api/category',
    options: {
      pre: [{ method: authenticate }],
    },
    handler: async (request, h) => {
      const payload = request.payload;

      try {
        const category = new Category(payload);
        await category.save();
        return h.response({ message: 'Category created', data: category }).code(201);
      } catch (error) {
        return h.response({ error: error.message }).code(400);
      }
    },
  },
  {
    method: 'GET',
    path: '/api/category',
    handler: async (request, h) => {
      try {
        const { category } = request.query;
        let criteria = {};


        const categories = await Category.find(criteria);
        return h.response(categories);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'PATCH',
    path: '/api/category/{id}',
    options: {
      pre: [{ method: authenticate }], // Use the middleware
    },
    handler: async (request, h) => {
      const { id } = request.params;
      const updates = request.payload; // Get the fields that need to be updated from the request payload

      if(updates.label) {
        await Product.updateMany({ 'category._id': id }, { $set: { 'category.label': updates.label } }, { multi: true });
      }

      try {
        // Find the category by ID and update the specified fields
        const category = await Category.findByIdAndUpdate(
          id,
          {
            $set: updates, // Use $set to update only the provided fields
          },
          { new: true } // Return the updated category
        );

        if (!category) {
          return h.response({ message: 'Category not found' }).code(404);
        }

        return h.response(category).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'DELETE',
    options: {
      pre: [{ method: authenticate }], // Use the middleware
    },
    path: '/api/category/{id}',
    handler: async (request, h) => {
      const { id } = request.params;

      try {
        // Find the category by ID and delete it
        const category = await Category.findByIdAndDelete(id);

        await Product.updateMany({ 'category._id': id }, { $set: { 'category': null } }, { multi: true });

        if (!category) {
          return h.response({ message: 'Category not found' }).code(404);
        }

        return h.response({ message: 'Category deleted successfully' }).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },

];
