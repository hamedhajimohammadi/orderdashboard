import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'today';

  const authUser = await getCurrentUser();
  const adminName = authUser?.username;

  if (!adminName) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Calculate Date Range
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (fromParam && toParam) {
        startDate = new Date(fromParam);
        endDate = new Date(toParam);
    } else if (range === 'today') {
        // Fallback if no explicit dates provided (though client should provide them now)
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    } else if (range === 'yesterday') {
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
    } else if (range === 'week') {
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
    }

    // 2. Fetch Orders
    const operatorNames = [adminName];
    if (authUser.display_name) {
        operatorNames.push(authUser.display_name);
    }

    const orders = await prisma.order.findMany({
        where: {
            operator_name: { in: operatorNames },
            status: 'completed',
            completed_at: {
                gte: startDate,
                lte: endDate
            }
        },
        select: {
            id: true,
            assigned_at: true,
            completed_at: true,
            final_payable: true // For potential revenue calc
        }
    });

    // 3. Fetch User Info (for bonus rate & today's active time)
    const user = await prisma.user.findUnique({
        where: { admin_username: adminName },
        select: { 
            bonus_rate: true, 
            worked_seconds_today: true 
        }
    });

    // 4. Calculate Stats
    const totalOrders = orders.length;
    
    // Calculate Average Time per Order
    let totalDurationSeconds = 0;
    let validDurationCount = 0;

    orders.forEach(o => {
        if (o.assigned_at && o.completed_at) {
            const duration = (new Date(o.completed_at) - new Date(o.assigned_at)) / 1000;
            if (duration > 0 && duration < 7200) { // Filter out outliers > 2 hours
                totalDurationSeconds += duration;
                validDurationCount++;
            }
        }
    });

    const avgTimeSeconds = validDurationCount > 0 ? Math.round(totalDurationSeconds / validDurationCount) : 0;
    const avgTimeMinutes = Math.round(avgTimeSeconds / 60);

    // Calculate Earnings (Simple: Count * Bonus Rate)
    const estimatedEarnings = totalOrders * (user?.bonus_rate || 0);

    // Active Time (Only valid for 'today')
    const activeSeconds = range === 'today' ? (user?.worked_seconds_today || 0) : null;

    return NextResponse.json({
        success: true,
        data: {
            range,
            totalOrders,
            avgTimeMinutes,
            estimatedEarnings,
            activeSeconds,
            bonusRate: user?.bonus_rate || 0
        }
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
