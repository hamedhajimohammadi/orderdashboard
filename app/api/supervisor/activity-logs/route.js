
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await prisma.orderLog.findMany({
      take: 20,
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            wp_order_id: true,
            id: true
          }
        }
      }
    });

    // سریالایز کردن BigInt
    const safeLogs = JSON.parse(JSON.stringify(logs, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      data: safeLogs
    });

  } catch (error) {
    console.error("Activity Logs API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
