
const ORDER_BOT_TOKEN = process.env.TELEGRAM_ORDER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const FINANCE_BOT_TOKEN = process.env.TELEGRAM_FINANCE_BOT_TOKEN;

type BotType = 'order' | 'finance';

export async function sendTelegramMessage(chatId: string | number | bigint, text: string, botType: BotType = 'order', replyMarkup: any = null) {
  const token = botType === 'finance' ? FINANCE_BOT_TOKEN : ORDER_BOT_TOKEN;

  if (!token || !chatId) {
    console.warn(`⚠️ Telegram token for ${botType} or Chat ID missing. Skipping message.`);
    return null;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body: any = {
      chat_id: chatId.toString(),
      text: text,
      parse_mode: 'HTML'
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!data.ok) {
      console.error(`❌ Telegram API Error (${botType}):`, data);
    } 
    return data;
  } catch (error) {
    console.error(`❌ Failed to send Telegram message (${botType}):`, error);
    return null;
  }
}

export async function editTelegramMessage(chatId: string | number, messageId: number, text: string, botType: BotType = 'order', replyMarkup: any = null) {
  const token = botType === 'finance' ? FINANCE_BOT_TOKEN : ORDER_BOT_TOKEN;
  if (!token) return null;

  try {
    const url = `https://api.telegram.org/bot${token}/editMessageText`;
    const body: any = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML'
    };
    if (replyMarkup) body.reply_markup = replyMarkup;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error('Edit Message Error:', error);
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text: string = '', showAlert: boolean = false, botType: BotType = 'order') {
  const token = botType === 'finance' ? FINANCE_BOT_TOKEN : ORDER_BOT_TOKEN;
  if (!token) return null;

  try {
    const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
      })
    });
  } catch (error) {
    console.error('Answer Callback Error:', error);
  }
}
