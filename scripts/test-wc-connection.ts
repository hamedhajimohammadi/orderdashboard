
import 'dotenv/config';

async function testConnection() {
    const siteUrl = process.env.WC_SITE_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (!siteUrl || !key || !secret) {
        console.error("❌ Missing .env variables");
        return;
    }

    console.log(`🔍 Testing connection to: ${siteUrl}`);
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
        const res = await fetch(`${siteUrl}/wp-json/wc/v3/orders?per_page=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
        });

        console.log(`📡 Status Code: ${res.status}`);
        console.log(`📡 Status Text: ${res.statusText}`);
        
        console.log("--- Headers ---");
        res.headers.forEach((val, key) => console.log(`${key}: ${val}`));
        console.log("---------------");

        const text = await res.text();
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            const data = JSON.parse(text);
            console.log(`✅ Success! Fetched ${data.length} orders.`);
            if (data.length > 0) {
                console.log(`Sample Order ID: ${data[0].id}`);
            }
        } else {
            console.error("❌ Error Body (First 1000 chars):", text.substring(0, 1000));
        }

    } catch (error) {
        console.error("❌ Network Error:", error);
    }
}

testConnection();
