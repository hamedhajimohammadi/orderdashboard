import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch fresh user data from DB to ensure we have the latest display_name
    const user = await prisma.user.findUnique({
        where: { id: currentUser.id }
    });

    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const operatorNames = [user.admin_username];
    if (user.display_name) {
        operatorNames.push(user.display_name);
    }
    // Also check for First Last name format which might be used by some APIs
    if (user.first_name && user.last_name) {
        operatorNames.push(`${user.first_name} ${user.last_name}`);
    }

    // محاسبه شروع امروز
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeOrders = await prisma.order.findMany({
      where: {
        operator_name: { in: operatorNames },
        status: 'processing'
      },
      include: {
        user: true
      },
      orderBy: { assigned_at: 'desc' }
    });

    const serializedData = JSON.parse(JSON.stringify(activeOrders, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: serializedData });
  } catch (error) {
    return NextResponse.json({ success: false, data: [] });
  }
}
