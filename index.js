const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const express = require('express');

// Express server to keep it alive
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(process.env.PORT || 3000);

// Secrets from Environment Variables
const token = process.env.TELEGRAM_TOKEN;
const proxyUrl = process.env.BRIGHT_DATA_PROXY;

const agent = new HttpsProxyAgent(proxyUrl);
const bot = new TelegramBot(token, {
  polling: true,
  request: { agent }
});

console.log('Bot is Online!');

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "স্বাগতম রিয়াদ ভাই! আপনার প্রক্সি বোট এখন সচল আছে। কার্ড ডিটেইলস পাঠান।");
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && !text.startsWith('/')) {
    bot.sendMessage(chatId, "আপনার কার্ডটি চেক করা হচ্ছে, দয়া করে অপেক্ষা করুন...");
    // এখানে আপনার কার্ড চেকিং লজিক কাজ করবে
  }
});
