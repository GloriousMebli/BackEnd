const Product = require('../models/Product');

const authenticate = require('../middlewares/authMiddleware');
const uploadImage = require('../functions/upload'); // Make sure to adjust the path

const multer = require('multer');

const upload = multer({ dest: 'uploads/' }); 

module.exports = [
  {
    method: 'POST',
    path: '/api/products',
    options: {
      pre: [{ method: authenticate }],
    },
    handler: async (request, h) => {
      const payload = request.payload;

      try {
        const product = new Product(payload);
        await product.save();
        return h.response({ message: 'Product created', data: product }).code(201);
      } catch (error) {
        return h.response({ error: error.message }).code(400);
      }
    },
  },
  {
    method: 'GET',
    path: '/api/products',
    handler: async (request, h) => {
      try {
        const { category } = request.query;
        let criteria = {};

        if (category) {
          criteria.category = category;
        }

        const products = await Product.find(criteria);
        return h.response(products);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'GET',
    path: '/api/products/{id}',
    handler: async (request, h) => {
      try {
        const product = await Product.findById(request.params.id);
        
        if (!product) {
          return h.response({ message: 'Product not found' }).code(404);
        }

        return h.response(product);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
  {
    method: 'PATCH',
    path: '/api/products/{id}',
    options: {
      pre: [{ method: authenticate }], // Use the middleware
    },
    handler: async (request, h) => {
      const { id } = request.params;
      const updates = request.payload; // Get the fields that need to be updated from the request payload

      try {
        // Find the product by ID and update the specified fields
        const product = await Product.findByIdAndUpdate(
          id,
          {
            $set: updates, // Use $set to update only the provided fields
          },
          { new: true } // Return the updated product
        );

        if (!product) {
          return h.response({ message: 'Product not found' }).code(404);
        }

        return h.response(product).code(200);
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
    path: '/api/products/{id}',
    handler: async (request, h) => {
      const { id } = request.params;

      try {
        // Find the product by ID and delete it
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
          return h.response({ message: 'Product not found' }).code(404);
        }

        return h.response({ message: 'Product deleted successfully' }).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },


  {
    method: 'POST',
    path: '/api/products/{id}/image',
    options: {
      pre: [{ method: authenticate }],
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: 10485760, // 10MB limit for image
      },
    },
    handler: async (request, h) => {
      const { id } = request.params;
      const { isMain = false, file } = request.payload; 

      try {
        // Find the product by ID
        const product = await Product.findById(id);
        if (!product) {
          return h.response({ message: 'Product not found' }).code(404);
        }

        const publicUrl = await uploadImage(file._data, file.hapi.filename);

        const imageInfo = {
          url: publicUrl,
          isMain
        };

        // Add the image information to the product
        product.images.push(imageInfo);
        await product.save();

        return h.response(product).code(200);
      } catch (error) {
        return h.response({ error: error.message }).code(500);
      }
    },
  },
];
