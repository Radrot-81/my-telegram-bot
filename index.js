const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot is Live!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// টোকেন এনভায়রনমেন্ট ভেরিয়েবল থেকে নিন
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error('TELEGRAM_TOKEN environment variable is not set.');
  process.exit(1);
}

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
