
import 'dotenv/config';

const ORDER_BOT_TOKEN = process.env.TELEGRAM_ORDER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

async function setWebhook() {
  if (!ORDER_BOT_TOKEN) {
    console.error('❌ TELEGRAM_ORDER_BOT_TOKEN is missing in .env');
    return;
  }

  // Get the public URL from arguments
  const publicUrl = process.argv[2];
  if (!publicUrl) {
    console.error('❌ Please provide your public URL as an argument.');
    console.error('Usage: npx tsx scripts/set-telegram-webhook.ts https://your-domain.com');
    return;
  }

  const webhookUrl = `${publicUrl}/api/webhook/telegram`;
  console.log(`🔗 Setting webhook to: ${webhookUrl}`);

  try {
    const url = `https://api.telegram.org/bot${ORDER_BOT_TOKEN}/setWebhook?url=${webhookUrl}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(data);
    } else {
      console.error('❌ Failed to set webhook:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

setWebhook();
