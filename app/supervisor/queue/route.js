import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const queue = await prisma.order.findMany({
      where: {
        status: { in: ['processing', 'ersal-payam', 'pending', 'on-hold', 'wc-awaiting-auth', 'refund-req'] }
      },
      include: {
        user: true,
        // اگر فیلد ادمین را اضافه کردی، اینجا رابطه را بیاور
      },
      orderBy: { order_date: 'desc' },
      take: 50 // برای سرعت، ۵۰ تای آخر را فعلاً نشان می‌دهیم
    });

    const safeQueue = JSON.parse(JSON.stringify(queue, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: safeQueue });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] });
  }
}