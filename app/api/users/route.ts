import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// تابع کمکی برای مدیریت BigInt و حذف پسورد از خروجی
function serialize(data) {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (key === 'admin_password') return undefined; // امنیت پسورد
    return typeof value === 'bigint' ? value.toString() : value;
  }));
}

// ۱. دریافت لیست پرسنل (بدون لود کردن ۸۰ هزار مشتری)
export async function GET() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'supervisor', 'administrator', 'shop_manager'] }
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(serialize(admins));
  } catch (error) {
    return NextResponse.json([]);
  }
}

// ۲. ساخت ادمین جدید با فیلد اختصاصی admin_username
export async function POST(req) {
  try {
    const body = await req.json();

    // بررسی تکراری نبودن نام کاربری مدیریت
    const existing = await prisma.user.findUnique({
      where: { admin_username: body.username }
    });

    if (existing) {
      return NextResponse.json({ message: 'این نام کاربری مدیریت قبلاً ثبت شده است' }, { status: 400 });
    }

    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(body.password || '123456', 10);

    // ایجاد کاربر (فیلد phone_number چون در اسکیمای تو Unique است، یوزرنیم را در آن هم ست می‌کنیم)
    await prisma.user.create({
      data: {
        admin_username: body.username,
        admin_password: hashedPassword,
        display_name: body.display_name,
        role: body.role || 'admin',
        phone_number: body.username, // رعایت قید یکتا بودن در دیتابیس فعلی
        daily_quota: parseInt(body.daily_quota) || 0,
        bonus_rate: parseInt(body.bonus_rate) || 0,
        base_salary: body.base_salary ? parseFloat(body.base_salary.toString().replace(/,/g, '')) : 0,
        is_banned: false
      }
    });

    const allAdmins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'supervisor', 'administrator'] } },
      orderBy: { id: 'desc' }
    });
    
    return NextResponse.json(serialize(allAdmins));
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ message: `خطای دیتابیس: ${error.message}` }, { status: 500 });
  }
}

// ۳. ویرایش اطلاعات یا بن کردن ادمین
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, password, ...updateData } = body;

    // تمیزکاری مبالغ عددی قبل از ذخیره
    if (updateData.base_salary) updateData.base_salary = parseFloat(updateData.base_salary.toString().replace(/,/g, ''));
    if (updateData.daily_quota) updateData.daily_quota = parseInt(updateData.daily_quota);

    // اگر رمز عبور جدید ارسال شده باشد، آن را هش می‌کنیم
    if (password && password.trim() !== '') {
      updateData.admin_password = await bcrypt.hash(password, 10);
    }

    // حذف فیلدهای اضافی که نباید آپدیت شوند (مثل username که در فرم هست ولی در دیتابیس admin_username است)
    delete updateData.username; 

    await prisma.user.update({
      where: { id: Number(id) },
      data: updateData
    });

    const allAdmins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'supervisor', 'administrator'] } },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(serialize(allAdmins));
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ message: 'خطا در ویرایش' }, { status: 500 });
  }
}

// ۴. حذف ادمین
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (user?.admin_username === 'admin') {
      return NextResponse.json({ message: 'حذف مدیر اصلی امکان‌پذیر نیست' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: Number(id) } });

    const allAdmins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'supervisor', 'administrator'] } },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(serialize(allAdmins));
  } catch (error) {
    return NextResponse.json({ message: 'خطا در حذف' }, { status: 500 });
  }
}