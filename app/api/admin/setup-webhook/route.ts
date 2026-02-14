import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = process.env.TELEGRAM_ORDER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Token not found in env' }, { status: 500 });
    }

    const webhookUrl = 'https://dashboard.pgemshop.com/api/webhook/telegram';
    const apiUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    return NextResponse.json({ 
      success: data.ok, 
      result: data,
      webhook_url: webhookUrl
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
