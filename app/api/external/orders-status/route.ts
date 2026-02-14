import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Security Check
    const apiKey = request.headers.get('X-API-KEY');
    const secret = process.env.SYNC_API_SECRET;

    if (!secret || apiKey !== secret) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parameters
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '50');
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    // 3. Database Query
    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: {
        created_at: 'desc'
      },
      select: {
        wp_order_id: true,
        status: true
      }
    });

    // 4. Response Format
    const formattedOrders = orders.map(order => ({
      id: Number(order.wp_order_id), // Convert BigInt to Number for JSON
      status: order.status.toUpperCase().replace(/-/g, '_') // e.g. 'need-verification' -> 'NEED_VERIFICATION'
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error fetching external order statuses:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
