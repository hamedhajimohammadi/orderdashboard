import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getIranStartOfDay } from '@/lib/utils';

export const dynamic = 'force-dynamic'; // جلوگیری از کش شدن

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'updated_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Map sortBy to prisma fields
    let orderBy = {};
    if (sortBy === 'order_id') {
        orderBy = { wp_order_id: sortOrder };
    } else if (sortBy === 'order_date') {
        orderBy = { order_date: sortOrder };
    } else {
        orderBy = { updated_at: sortOrder };
    }

    // دریافت سفارش‌هایی که این کاربر روی آن‌ها عملی انجام داده است
    // ۱. یا کاربر فعلی به عنوان اپراتور ثبت شده است (operator_name)
    // ۲. یا در لاگ‌ها ردی از این کاربر وجود دارد (admin_name)
    
    // نکته: برای سادگی و سرعت، فعلاً فقط سفارش‌هایی که operator_name آن‌ها برابر با کاربر است را می‌گیریم
    // اگر نیاز به تاریخچه دقیق‌تر بود، باید از جدول OrderLog جوین بزنیم
    
    const myOrders = await prisma.order.findMany({
      where: {
        AND: [
          {
            OR: [
              { operator_name: currentUser.display_name },
              { operator_name: currentUser.username }
            ]
          },
          {
            status: {
              not: 'processing' // فقط سفارش‌هایی که وضعیتشان processing نیست
            }
          }
        ]
      },
      include: {
        user: true
      },
      orderBy: orderBy,
      take: 100 // محدودیت نمایش ۱۰۰ مورد آخر
    });

    // تبدیل BigInt به String
    const safeOrders = JSON.parse(JSON.stringify(myOrders, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    // محاسبه آمار روزانه از دیتابیس (به وقت ایران)
    const today = getIranStartOfDay();

    const dailyCount = await prisma.order.count({
      where: {
        AND: [
          {
            OR: [
              { operator_name: currentUser.display_name },
              { operator_name: currentUser.username }
            ]
          },
          { status: 'completed' },
          { completed_at: { gte: today } }
        ]
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: safeOrders,
      dailyStats: {
        completed: dailyCount,
        target: 25, // این عدد می‌تواند از تنظیمات خوانده شود
        bonusRate: 5000
      }
    });

  } catch (error) {
    console.error("My History Error:", error);
    return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });
  }
}