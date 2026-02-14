import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: startDate,
        },
        status: {
          not: 'cancelled' // Exclude cancelled orders
        }
      },
      select: {
        created_at: true,
        discount_type: true,
        affiliate_amount: true,
        coupon_amount: true,
        loyalty_amount: true,
        total_amount_gross: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Process data for charts
    const dailyStats = {};
    const summary = {
      total_orders: 0,
      affiliate_count: 0,
      general_coupon_count: 0,
      loyalty_count: 0,
      no_discount_count: 0,
      
      total_affiliate_amount: 0,
      total_coupon_amount: 0,
      total_loyalty_amount: 0,
    };

    orders.forEach(order => {
      const dateKey = new Date(order.created_at).toLocaleDateString('fa-IR'); // Persian date for grouping
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          affiliate: 0,
          general: 0,
          loyalty: 0,
          none: 0,
          affiliate_amount: 0,
          general_amount: 0,
          loyalty_amount: 0,
        };
      }

      summary.total_orders++;

      // Determine primary discount driver for count (simplified logic)
      // An order can have multiple, but we want to see "usage"
      let hasDiscount = false;

      if (Number(order.affiliate_amount) > 0) {
        dailyStats[dateKey].affiliate++;
        dailyStats[dateKey].affiliate_amount += Number(order.affiliate_amount);
        summary.affiliate_count++;
        summary.total_affiliate_amount += Number(order.affiliate_amount);
        hasDiscount = true;
      }
      
      if (Number(order.coupon_amount) > 0) {
        dailyStats[dateKey].general++;
        dailyStats[dateKey].general_amount += Number(order.coupon_amount);
        summary.general_coupon_count++;
        summary.total_coupon_amount += Number(order.coupon_amount);
        hasDiscount = true;
      }

      if (Number(order.loyalty_amount) > 0) {
        dailyStats[dateKey].loyalty++;
        dailyStats[dateKey].loyalty_amount += Number(order.loyalty_amount);
        summary.loyalty_count++;
        summary.total_loyalty_amount += Number(order.loyalty_amount);
        hasDiscount = true;
      }

      if (!hasDiscount) {
        dailyStats[dateKey].none++;
        summary.no_discount_count++;
      }
    });

    return NextResponse.json({
      success: true,
      data: Object.values(dailyStats),
      summary
    });

  } catch (error) {
    console.error('Error fetching marketing stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
