import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

// --- Configuration ---
const GOFTINO_API_KEY = process.env.GOFTINO_API_KEY;
const GOFTINO_OPERATOR_ID = process.env.GOFTINO_OPERATOR_ID || "64e8ed8915e2e32bff4c4953"; 
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// --- Helper Functions ---

function toEnglishDigits(str: string): string {
  return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
            .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

async function sendGoftinoMessage(chatId: string, text: string) {
  if (!GOFTINO_API_KEY) return;
  try {
    await axios.post('https://api.goftino.com/v1/send_message', {
      chat_id: chatId,
      operator_id: GOFTINO_OPERATOR_ID,
      message: text
    }, {
      headers: { 
        'goftino-key': GOFTINO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Goftino Error:', error);
  }
}

async function sendTelegramMessage(chatId: number | string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Telegram Error:', error);
  }
}

async function getQueuePosition(orderId: string) {
    // تاریخ شروع صف جدید (طبق درخواست کاربر)
    const CUTOFF_DATE = new Date('2025-12-31T00:00:00.000Z');
    
    try {
        const order = await prisma.order.findUnique({ 
            where: { wp_order_id: BigInt(orderId) } 
        });

        if (!order) return "سفارش یافت نشد. لطفا شماره سفارش صحیح را وارد کنید.";
        
        if (order.status === 'completed') return "سفارش شما تکمیل شده است.";
        if (order.status === 'cancelled') return "سفارش شما لغو شده است.";
        
        // بررسی اینکه آیا سفارش در صف انتظار است
        // شرط: وضعیت waiting یا (processing بدون اپراتور)
        const isWaiting = (order.status === 'waiting') || (order.status === 'processing' && !order.operator_name);
        
        if (!isWaiting) {
             if (order.operator_name) return "سفارش شما در حال انجام توسط اپراتور است.";
             return `وضعیت سفارش شما: ${order.status}`;
        }

        // محاسبه نوبت
        const position = await prisma.order.count({
            where: {
                AND: [
                    {
                        OR: [
                            { status: 'waiting' },
                            { status: 'processing', operator_name: null }
                        ]
                    },
                    {
                        order_date: { gte: CUTOFF_DATE }
                    },
                    {
                        order_date: { lt: order.order_date } // کسانی که قبل از این سفارش ثبت کرده‌اند
                    }
                ]
            }
        });

        return `سفارش شما در صف انتظار است.\nنوبت شما: ${position + 1}`;

    } catch (e) {
        console.error(e);
        return "خطا در دریافت اطلاعات سفارش.";
    }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Detect Source
    let source = 'unknown';
    let chatId = null;
    let messageText = '';

    // Telegram
    if (body.update_id && body.message) {
        source = 'telegram';
        chatId = body.message.chat.id;
        messageText = body.message.text || '';
    } 
    // Goftino
    else if (body.event === 'new_message') {
        source = 'goftino';
        chatId = body.chat_id;
        messageText = body.text;
    }

    if (!chatId || !messageText) {
        return NextResponse.json({ status: 'ignored' });
    }

    const text = toEnglishDigits(messageText).trim();
    let reply = "";

    // منطق ساده: اگر عدد بود -> شماره سفارش، در غیر این صورت -> راهنما
    if (/^\d+$/.test(text)) {
        reply = await getQueuePosition(text);
    } else if (text.includes('نوبت') || text.includes('صف') || text.includes('queue') || text.includes('پیگیری')) {
        reply = "لطفا فقط شماره سفارش خود را (به صورت عدد) ارسال کنید.";
    } else {
        reply = "سلام! سیستم پاسخگویی خودکار.\nبرای اطلاع از وضعیت سفارش و نوبت خود، لطفا فقط **شماره سفارش** را ارسال کنید.";
    }

    if (source === 'telegram') {
        await sendTelegramMessage(chatId, reply);
    } else if (source === 'goftino') {
        await sendGoftinoMessage(chatId as string, reply);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
