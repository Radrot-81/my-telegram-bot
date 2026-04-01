const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// ১. Render-এ বোট সচল রাখার জন্য ছোট একটি সার্ভার
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// ২. টেলিগ্রাম টোকেন (যা আপনি Render Environment Variable-এ দিয়েছেন)
const token = process.env.TELEGRAM_TOKEN;

// ৩. বোট সেটআপ (সরাসরি কানেকশন, কোনো প্রক্সি লাগবে না)
const bot = new TelegramBot(token, {
  polling: true
});

console.log('--- Bot is Online, Riyad Bhai! ---');

// ৪. স্টার্ট কমান্ড দিলে যা হবে
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "আসসালামু আলাইকুম রিয়াদ ভাই!\nআপনার বোট এখন Render-এ সফলভাবে চলছে। কার্ড ডিটেইলস এখানে পাঠাতে পারেন।");
});

// ৫. যেকোনো মেসেজ আসলে যা হবে
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // যদি মেসেজটি কোনো কমান্ড না হয় (যেমন কার্ড নম্বর)
  if (text && !text.startsWith('/')) {
    bot.sendMessage(chatId, "আপনার মেসেজটি আমি পেয়েছি। এটি এখন প্রসেস করা হচ্ছে...");
    
    // এখানে আপনার কার্ড চেকিং এর বাকি কাজ হবে
    console.log(`New Message from ${chatId}: ${text}`);
  }
});

// ৬. এরর হ্যান্ডলিং (যাতে বোট ক্রাশ না করে)
bot.on('polling_error', (error) => {
  console.log('Polling Error:', error.code); 
});
