import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // اتصال استاندارد به دیتابیس ما

// 🛠️ تابع کمکی: تبدیل BigInt به String
// دیتابیس شما از BigInt استفاده می‌کند ولی JSON آن را نمی‌فهمد. این تابع مشکل را حل می‌کند.
const jsonWithBigInt = (data) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint'
      ? value.toString()
      : value
  ));
};

export async function GET(request) {
  try {
    // 1. خواندن پارامترهای URL (برای اینکه بتونی فیلتر کنی)
    // کد قبلی شما هاردکد کرده بود status=processing
    // اینجا ما داینامیکش می‌کنیم:
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); 
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // پیش‌فرض ۵۰ تا (مثل کد قبلی)
    
    // محاسبه پرش برای صفحه‌بندی
    const skip = (page - 1) * limit;

    // 2. ساخت شرط جستجو (Where Clause)
    let whereCondition = {};
    
    // فیلتر تاریخ (فقط سفارش‌های امروز به بعد)
    // اگر پارامتر fromToday=true باشد یا کلاً بخواهیم پیش‌فرض باشد
    const fromToday = searchParams.get('fromToday') === 'true';
    
    if (id) {
        whereCondition.id = parseInt(id);
    } else if (fromToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereCondition.order_date = {
        gte: today
      };
    }
    
    // اگر استاتوس خاصی خواسته شده بود (مثلا processing)، فیلتر کن
    // اگر چیزی نخواسته بود، همه را بیار (تا ۱۰۰۰ سفارش تستی رو ببینی)
    if (status && status !== 'all') {
      whereCondition.status = status;
    } else if (!status || status === 'all') {
        // اگر همه را خواست، باز هم بهتر است waiting ها را هم بیاوریم
        // اما چون شرط خالی است، همه را می‌آورد.
    }

    console.log(`⚡️ Reading from DB | Page: ${page} | Status: ${status || 'ALL'}`);

    // 3. دریافت سفارش‌ها از دیتابیس (جایگزین fetch قبلی)
    const orders = await prisma.order.findMany({
      where: whereCondition,
      take: limit, // چند تا بیاره (۵۰)
      skip: skip,  // چند تا رد کنه
      orderBy: {
        order_date: 'desc', // جدیدترین‌ها اول
      },
      // ✅ نکته مهم: این خط باعث می‌شود اطلاعات مشتری هم به سفارش چسبانده شود
      include: {
        user: true, 
      },
    });

    // 4. دریافت تعداد کل (برای اینکه بدونی چند صفحه داری)
    const totalCount = await prisma.order.count({ where: whereCondition });

    // 5. ارسال پاسخ
    return NextResponse.json({
      success: true,
      data: jsonWithBigInt(orders), // لیست سفارش‌ها
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("❌ Database Error:", error);
    // در صورت خطا، همان رفتار کد قبلی (آرایه خالی) را شبیه‌سازی می‌کنیم
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}