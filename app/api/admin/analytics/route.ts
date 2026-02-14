import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // 1. Daily Sales Trend (Completed Orders)
    // We use raw query for efficient grouping by date
    const salesTrend = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(order_date, 'YYYY-MM-DD') as date,
        COUNT(*)::int as count,
        SUM(final_payable)::bigint as revenue
      FROM orders
      WHERE 
        status = 'completed' 
        AND order_date >= NOW() - (INTERVAL '1 day' * ${days})
      GROUP BY TO_CHAR(order_date, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    // 2. Status Distribution (All Orders in period)
    const statusDist = await prisma.order.groupBy({
      by: ['status'],
      where: {
        order_date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      _count: {
        _all: true
      }
    });

    // 3. Key Metrics (Current Period vs Previous Period)
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000);

    const currentMetrics = await prisma.order.aggregate({
      where: {
        status: 'completed',
        order_date: { gte: currentPeriodStart }
      },
      _sum: { final_payable: true },
      _count: { _all: true }
    });

    const previousMetrics = await prisma.order.aggregate({
      where: {
        status: 'completed',
        order_date: { 
          gte: previousPeriodStart,
          lt: currentPeriodStart
        }
      },
      _sum: { final_payable: true },
      _count: { _all: true }
    });

    // Calculate Growth
    const currentRevenue = Number(currentMetrics._sum.final_payable || 0);
    const previousRevenue = Number(previousMetrics._sum.final_payable || 0);
    const revenueGrowth = previousRevenue === 0 ? 100 : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    const currentOrders = currentMetrics._count._all;
    const previousOrders = previousMetrics._count._all;
    const ordersGrowth = previousOrders === 0 ? 100 : ((currentOrders - previousOrders) / previousOrders) * 100;

    // Serialize BigInt
    const serializedTrend = (salesTrend as any[]).map(item => ({
      date: item.date,
      count: Number(item.count),
      revenue: Number(item.revenue)
    }));

    return NextResponse.json({
      success: true,
      data: {
        trend: serializedTrend,
        statusDistribution: statusDist.map(s => ({ name: s.status, value: s._count._all })),
        summary: {
          revenue: currentRevenue,
          revenueGrowth: revenueGrowth.toFixed(1),
          orders: currentOrders,
          ordersGrowth: ordersGrowth.toFixed(1),
          aov: currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0
        }
      }
    });

  } catch (error: any) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
