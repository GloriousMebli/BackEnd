// controllers/sitemapController.js
const { SitemapStream, streamToPromise } = require('sitemap');
const Product = require('./models/Product');
const Category = require('./models/Category');

const generateSitemap = async (req, res) => {
  try {
    const sitemap = new SitemapStream({ hostname: 'https://glorious.com.ua' });

    // Додайте головну сторінку
    sitemap.write({ url: '/', changefreq: 'daily', priority: 1.0 });

    // Додайте статичні сторінки, як каталог та блог
    sitemap.write({ url: '/catalog', changefreq: 'weekly', priority: 0.8 });
    sitemap.write({ url: 'catalog/:id', changefreq: 'weekly', priority: 0.8 });
    sitemap.write({ url: '/blog', changefreq: 'weekly', priority: 0.8 });

    // Додайте динамічні сторінки товарів (з MongoDB)
    const products = await Product.find();
    products.forEach(product => {
      sitemap.write({
        url: `/catalog/${product._id}`,
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    // Додайте динамічні сторінки категорій
    const categories = await Category.find();
    categories.forEach(category => {
      sitemap.write({
        url: `/category/${category._id}`,
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    sitemap.end();

    const xmlString = await streamToPromise(sitemap);

    res.header('Content-Type', 'application/xml');
    res.send(xmlString.toString());
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};

module.exports = { generateSitemap };
