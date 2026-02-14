
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getIranStartOfDay } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // ساخت شرط‌های جستجو
    const whereClause = {
      AND: []
    };

    // فیلتر وضعیت
    if (status !== 'all') {
      if (status === 'waiting') {
        // ✅ تب "آماده انجام": شامل waiting و processing بدون اپراتور
        whereClause.AND.push({
          OR: [
            { status: 'waiting' },
            { 
              AND: [
                { status: 'processing' },
                { operator_name: null }
              ]
            }
          ]
        });
      } else if (status === 'processing') {
        // ✅ تب "در حال انجام": فقط processing هایی که اپراتور دارند
        whereClause.AND.push({
          status: 'processing',
          operator_name: { not: null }
        });
      } else if (status === 'need-verification') {
        whereClause.AND.push({
          status: { in: ['need-verification', 'verification', 'wc-awaiting-auth'] }
        });
      } else if (status === 'wrong-info') {
        whereClause.AND.push({
          status: { in: ['wrong-info', 'wrong_info', 'wc-wrong-info'] }
        });
      } else if (status === 'refund-req') {
        whereClause.AND.push({
          status: { in: ['refund-req', 'awaiting-refund', 'wc-awaiting-refund'] }
        });
      } else {
        // سایر وضعیت‌ها
        whereClause.AND.push({ status: status });
      }
    }

    // فیلتر تاریخ (فقط سفارش‌های امروز به بعد)
    const fromToday = searchParams.get('fromToday') === 'true';
    const fromYesterday = searchParams.get('fromYesterday') === 'true';
    
    // ✅ تغییر درخواست شده: نمایش سفارشات از ۳۱ دسامبر ۲۰۲۵ به بعد
    // اگر فیلتر خاصی (مثل fromToday) نیامده بود، پیش‌فرض این تاریخ اعمال شود.
    // اگر fromYesterday آمده بود هم همین تاریخ را اعمال می‌کنیم چون ۳۱ دسامبر عقب‌تر است.
    
    const CUTOFF_DATE = new Date('2025-12-31T00:00:00.000Z');

    if (fromToday) {
        const startOfDay = getIranStartOfDay();
        whereClause.AND.push({ order_date: { gte: startOfDay } });
    } else if (fromYesterday) {
        // کاربر درخواست "از دیروز" کرده، اما طبق دستور جدید باید "از ۳۱ دسامبر" باشد.
        // پس ما CUTOFF_DATE را اعمال می‌کنیم که شامل دیروز و قبل‌تر هم می‌شود.
        whereClause.AND.push({ order_date: { gte: CUTOFF_DATE } });
    } else if (!search) {
        // اگر جستجو نمی‌کند و فیلتر خاصی هم ندارد، باز هم محدودیت ۳۱ دسامبر را اعمال کن
        // تا دیتابیس زیر بار کوئری‌های سنگین قدیمی نرود
        whereClause.AND.push({ order_date: { gte: CUTOFF_DATE } });
    }
    // اگر search دارد، هیچ فیلتر تاریخی اعمال نمی‌شود (طبق اصلاحیه قبلی)

    // جستجو
    if (search) {
      const searchInt = !isNaN(search) ? parseInt(search) : undefined;
      const searchBigInt = !isNaN(search) ? BigInt(search) : undefined;

      whereClause.AND.push({
        OR: [
          { id: searchInt },
          { wp_order_id: searchBigInt }, // جستجو با شناسه ووکامرس
          { order_title: { contains: search, mode: 'insensitive' } },
          { user: { phone_number: { contains: search } } },
          { user: { last_name: { contains: search, mode: 'insensitive' } } },
          { operator_name: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // مرتب‌سازی پویا
    let orderBy = [
      { is_pinned: 'desc' }, 
      { created_at: 'desc' }
    ];

    if (status === 'completed') {
      orderBy = [
        { is_pinned: 'desc' },
        { completed_at: 'desc' } // برای تکمیل شده‌ها، زمان تکمیل مهم است
      ];
    } else if (status === 'processing') {
      orderBy = [
        { is_pinned: 'desc' },
        { assigned_at: 'desc' } // برای در حال انجام، زمان ارجاع
      ];
    } else if (['refund-req', 'wrong-info', 'need-verification'].includes(status)) {
      orderBy = [
        { is_pinned: 'desc' },
        { updated_at: 'desc' } // برای موارد نیازمند بررسی، آخرین تغییر مهم است
      ];
    }

    console.log(`🔍 Fetching orders. Status: ${status}, Page: ${page}, Search: ${search}`);
    console.log(`🔍 Where Clause:`, JSON.stringify(whereClause, (key, value) => typeof value === 'bigint' ? value.toString() : value));

    // دریافت تعداد کل برای صفحه‌بندی
    const total = await prisma.order.count({ where: whereClause });
    console.log(`🔍 Total found: ${total}`);

    // دریافت داده‌ها
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            phone_number: true,
            id: true,
            real_name: true,
            national_code: true,
            card_number: true,
            bank_name: true,
            verification_file: true,
            is_verified: true,
            orders_count: true
          }
        }
      },
      orderBy: orderBy,
      skip,
      take: limit
    });

    // ---------------------------------------------------------
    // 🕵️‍♂️ Auto-Sync Logic (Supervisor Panel)
    // اگر جستجو عددی بود و در دیتابیس پیدا نشد، از ووکامرس استعلام بگیر
    // ---------------------------------------------------------
    if (orders.length === 0 && search && /^\d+$/.test(search)) {
        console.log(`⚠️ Order ${search} not found in DB (Supervisor). Trying WooCommerce...`);
        try {
            const ck = process.env.WC_CONSUMER_KEY;
            const cs = process.env.WC_CONSUMER_SECRET;
            const url = process.env.WC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
            
            const res = await fetch(`${url}/wp-json/wc/v3/orders/${search}?consumer_key=${ck}&consumer_secret=${cs}`);
            
            if (res.ok) {
                const wcOrder = await res.json();
                console.log(`✅ Found order ${search} in WC. Syncing...`);
                
                // Dynamically import to avoid circular deps if any
                const { syncOrderWithWooCommerce } = await import('@/lib/sync-helper');
                const syncedOrder = await syncOrderWithWooCommerce(wcOrder);
                
                // Fetch the full order again
                const fullOrder = await prisma.order.findUnique({
                    where: { id: syncedOrder.id },
                    include: {
                        user: {
                            select: {
                                first_name: true,
                                last_name: true,
                                phone_number: true,
                                id: true,
                                real_name: true,
                                national_code: true,
                                card_number: true,
                                bank_name: true,
                                verification_file: true,
                                is_verified: true,
                                orders_count: true
                            }
                        }
                    }
                });

                if (fullOrder) {
                    const safeOrder = JSON.parse(JSON.stringify(fullOrder, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value
                    ));

                    return NextResponse.json({
                        success: true,
                        data: [safeOrder],
                        pagination: {
                            total: 1,
                            page: 1,
                            limit: limit,
                            totalPages: 1
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Error auto-syncing from supervisor search:", e);
        }
    }
    // ---------------------------------------------------------

    // سریالایز کردن BigInt
    const safeOrders = JSON.parse(JSON.stringify(orders, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      data: safeOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Command Center API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
