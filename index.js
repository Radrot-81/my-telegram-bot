const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot is Live!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// টোকেনটি সরাসরি না লিখে Environment Variable থেকে নেওয়া হচ্ছে
const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "সালাম রিয়াদ ভাই! আমি এখন সচল আছি।");
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, "আমি আপনার মেসেজ পেয়েছি!");
  }
});

bot.on('polling_error', (error) => console.log('Error:', error.code));
