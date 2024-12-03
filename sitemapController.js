// controllers/sitemapController.js
const { SitemapStream, streamToPromise } = require('sitemap');
const Product = require('./models/Product');
const Category = require('./models/Category');

const transliterate = (text) => {
  const cyrillicToLatinMap = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
    з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ю: 'yu', я: 'ya',
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Є: 'Ye', Ж: 'Zh',
    З: 'Z', И: 'Y', І: 'I', Ї: 'Yi', Й: 'Y', К: 'K', Л: 'L', М: 'M',
    Н: 'N', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F',
    Х: 'Kh', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Shch', Ю: 'Yu', Я: 'Ya',
    "'": '', "’": '', "ʼ": '',
  };

  return text
    .split('')
    .map(char => cyrillicToLatinMap[char] || char) // Заміна кирилиці на латиницю
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[/\\]/g, '-') // Заміна "/" і "\" на дефіс
    .replace(/\s+/g, '-') // Заміна пробілів на дефіс
    .replace(/[^a-z0-9-]/g, ''); // Видалення інших небажаних символів
};

const generateSitemap = async (req, res) => {
  try {
    const sitemap = new SitemapStream({ hostname: 'https://glorious.com.ua' });

    // Додайте головну сторінку
    sitemap.write({ url: '/', changefreq: 'daily', priority: 1.0 });

    // Додайте статичні сторінки, як каталог та блог
    sitemap.write({ url: '/catalog', changefreq: 'weekly', priority: 0.8 });
    sitemap.write({ url: '/catalog/:id/:name', changefreq: 'weekly', priority: 0.8 });
    sitemap.write({ url: '/blog', changefreq: 'weekly', priority: 0.8 });

    // Додайте динамічні сторінки товарів (з MongoDB)
    const products = await Product.find();
    products.forEach(product => {
      sitemap.write({
        url: `/catalog/${product._id}/${transliterate(product.name)}`,
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    // Додайте динамічні сторінки категорій
    const categories = await Category.find();
    categories.forEach(category => {
      sitemap.write({
        url: `/category/${category._id}/${transliterate(category.label)}`,
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
