
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. پیدا کردن هزینه‌هایی که سررسیدشان امروز یا فردا است
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfToday = new Date(now.setHours(0,0,0,0));
    const endOfTomorrow = new Date(tomorrow.setHours(23,59,59,999));

    const dueExpenses = await prisma.expense.findMany({
      where: {
        due_date: {
          gte: startOfToday,
          lte: endOfTomorrow
        },
        is_paid: false // فقط پرداخت نشده‌ها
      }
    });

    if (dueExpenses.length === 0) {
      return NextResponse.json({ message: 'No due expenses found' });
    }

    // 2. پیدا کردن ادمین‌هایی که چت آیدی دارند
    // فرض می‌کنیم به همه ادمین‌های اصلی پیام می‌دهیم یا فقط به کاربری که نقش admin دارد
    const admins = await prisma.user.findMany({
      where: {
        telegram_chat_id: { not: null }
      }
    });

    if (admins.length === 0) {
      return NextResponse.json({ message: 'No admins with telegram_chat_id found' });
    }

    // 3. ارسال پیام
    let sentCount = 0;
    for (const expense of dueExpenses) {
      const message = `
🔔 <b>یادآوری سررسید هزینه</b>

📌 عنوان: ${expense.title}
💰 مبلغ: ${parseInt(expense.amount).toLocaleString()} تومان
📅 تاریخ سررسید: ${new Date(expense.due_date).toLocaleDateString('fa-IR')}

لطفاً نسبت به پرداخت یا بررسی اقدام کنید.
      `;

      for (const admin of admins) {
        const success = await sendTelegramMessage(admin.telegram_chat_id.toString(), message, 'finance');
        if (success) sentCount++;
      }
    }

    return NextResponse.json({ success: true, sentCount });

  } catch (error) {
    console.error("Reminder Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
