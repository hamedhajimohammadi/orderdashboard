
const ORDER_BOT_TOKEN = process.env.TELEGRAM_ORDER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const FINANCE_BOT_TOKEN = process.env.TELEGRAM_FINANCE_BOT_TOKEN;

export async function sendTelegramMessage(chatId, text, botType = 'order') {
  const token = botType === 'finance' ? FINANCE_BOT_TOKEN : ORDER_BOT_TOKEN;

  if (!token) {
    console.error(`TELEGRAM_${botType.toUpperCase()}_BOT_TOKEN is not set`);
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram API Error:", data);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Telegram Network Error:", error);
    return false;
  }
}
