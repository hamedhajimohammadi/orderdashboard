
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req) {
  try {
    const { chatId, type = 'order' } = await req.json();
    
    if (!chatId) {
      return NextResponse.json({ success: false, message: 'Chat ID is required' });
    }

    const success = await sendTelegramMessage(chatId, `✅ <b>تست اتصال موفقیت‌آمیز بود! (${type})</b>\n\nسیستم مدیریت سفارشات`, type);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to send message. Check Bot Token and Chat ID.' });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
