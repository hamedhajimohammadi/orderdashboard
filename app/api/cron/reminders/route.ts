import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { addDays, startOfDay, endOfDay, isBefore } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    const threeDaysLater = addDays(today, 3);
    const channelId = process.env.TELEGRAM_FINANCE_CHANNEL_ID || process.env.TELEGRAM_ADMIN_CHANNEL_ID;

    if (!channelId) {
      return NextResponse.json({ error: 'No Telegram Channel ID configured' }, { status: 500 });
    }

    // 1. Due in 3 Days
    const dueSoon = await prisma.expense.findMany({
      where: {
        status: 'PENDING',
        due_date: {
          gte: startOfDay(threeDaysLater),
          lte: endOfDay(threeDaysLater)
        }
      }
    });

    // 2. Due Today
    const dueToday = await prisma.expense.findMany({
      where: {
        status: 'PENDING',
        due_date: {
          gte: startOfDay(today),
          lte: endOfDay(today)
        }
      }
    });

    // 3. Overdue (Due date < today)
    const overdue = await prisma.expense.findMany({
      where: {
        status: 'PENDING',
        due_date: {
          lt: startOfDay(today)
        }
      }
    });

    // Send Messages
    let sentCount = 0;

    for (const expense of dueSoon) {
      const msg = `⚠️ <b>یادآوری پرداخت (۳ روز مانده)</b>\n\n💰 مبلغ: ${Number(expense.amount).toLocaleString()} تومان\n📝 بابت: ${expense.title}\n📅 سررسید: ${new Date(expense.due_date).toLocaleDateString('fa-IR')}`;
      await sendTelegramMessage(channelId, msg);
      sentCount++;
    }

    for (const expense of dueToday) {
      const msg = `🚨 <b>سررسید پرداخت (امروز)</b>\n\n💰 مبلغ: ${Number(expense.amount).toLocaleString()} تومان\n📝 بابت: ${expense.title}\n📅 سررسید: ${new Date(expense.due_date).toLocaleDateString('fa-IR')}\n\nلطفا سریعتر اقدام کنید.`;
      await sendTelegramMessage(channelId, msg);
      sentCount++;
    }

    // Only send overdue alerts once a day or mark them? 
    // To avoid spam, maybe we should check if we already sent a reminder today?
    // For now, I'll just send them. In a real app, we'd track "last_reminder_sent_at".
    // I'll limit overdue to 5 to avoid massive spam if many are overdue.
    for (const expense of overdue.slice(0, 5)) {
      const msg = `🔥 <b>هشدار: پرداخت معوقه</b>\n\n💰 مبلغ: ${Number(expense.amount).toLocaleString()} تومان\n📝 بابت: ${expense.title}\n📅 سررسید: ${new Date(expense.due_date).toLocaleDateString('fa-IR')}\n\nوضعیت: OVERDUE ❌`;
      await sendTelegramMessage(channelId, msg);
      sentCount++;
    }

    // Update status to OVERDUE if not already
    if (overdue.length > 0) {
      await prisma.expense.updateMany({
        where: {
          id: { in: overdue.map(e => e.id) },
          status: 'PENDING'
        },
        data: { status: 'OVERDUE' }
      });
    }

    return NextResponse.json({ success: true, sentCount });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
