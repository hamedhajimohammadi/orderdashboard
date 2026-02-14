
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const ORDER_BOT_TOKEN = process.env.TELEGRAM_ORDER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

async function getWebhookInfo() {
  if (!ORDER_BOT_TOKEN) {
    console.error('❌ TELEGRAM_ORDER_BOT_TOKEN is missing.');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${ORDER_BOT_TOKEN}/getWebhookInfo`;
    const response = await fetch(url);
    const data = await response.json();

    console.log('🔍 Webhook Info:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

getWebhookInfo();
