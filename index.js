const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot is Live!'));
app.listen(process.env.PORT || 3000);

// সরাসরি টোকেন বসিয়ে দিচ্ছি যাতে কোনো ভুল না হয়
const token = '8627459043:AAEqxjJl6CHIzOtL5z_c7Waq96x845yj2TY';

const bot = new TelegramBot(token, { polling: true });

console.log('Bot is starting...');

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "সালাম রিয়াদ ভাই! আমি এখন লাইভ আছি।");
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, "আপনার মেসেজ পেয়েছি: " + msg.text);
  }
});
