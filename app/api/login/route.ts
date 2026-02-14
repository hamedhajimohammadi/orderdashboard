import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-me';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // جستجوی کاربر در دیتابیس
    const user = await prisma.user.findUnique({
      where: { admin_username: username },
    });

    if (!user || !user.admin_password) {
      return NextResponse.json(
        { message: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.admin_password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // بررسی دسترسی (اختیاری: اگر فیلد is_banned دارید)
    if (user.is_banned) {
      return NextResponse.json(
        { message: 'حساب کاربری شما مسدود شده است' },
        { status: 403 }
      );
    }

    // تولید توکن JWT
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ 
      id: user.id, 
      username: user.admin_username, 
      role: user.role,
      display_name: user.display_name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    // به‌روزرسانی وضعیت آنلاین (اختیاری)
    await prisma.user.update({
      where: { id: user.id },
      data: { is_online: true, last_active_at: new Date() }
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        display_name: user.display_name,
        role: user.role,
      }
    });

    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}