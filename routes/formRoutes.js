const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const authenticate = require('../middlewares/authMiddleware');
const uploadImage = require('../functions/upload'); // Adjust path if needed
const axios = require('axios');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

const TELEGRAM_TOKEN = '7794005080:AAFoOVUn-ynMKKrHxQbbgcICJ7xCK3FMFKk';
const CHAT_IDS = ['985268057'];

router.post('', async (req, res) => {
  const { name, phone } = req.body;
  const text = `Заявка від:${name}\nНомер Телефону: ${phone}`;

  try {
    const promises = CHAT_IDS.map(chatId => {
        return axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: text
        });
    });

    await Promise.all(promises);

    res.status(200).send({ success: true, message: 'Повідомлення відправлено в усі чати Telegram' });
} catch (error) {
    console.error('Помилка при відправці повідомлення:', error.message);
    res.status(500).send({ success: false, message: 'Помилка при відправці повідомлення в Telegram' });
}
});

module.exports = router;
