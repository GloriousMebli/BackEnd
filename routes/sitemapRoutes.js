// routes/sitemapRoutes.js
const express = require('express');
const router = express.Router();
const { generateSitemap } = require('../sitemapController');

// Маршрут для генерації sitemap
router.get('/sitemap.xml', generateSitemap);

module.exports = router;
