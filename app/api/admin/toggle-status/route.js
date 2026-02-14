import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: currentUser.id } });

    if (!user) return NextResponse.json({ success: false, message: "User not found" });

    if (user.is_online) {
      // 🛑 ادمین دکمه "پایان کار" را زده است
      // محاسبه زمان سپری شده در این نشست و اضافه کردن به کل کارکرد امروز
      const sessionSeconds = Math.floor((Date.now() - new Date(user.last_active_at).getTime()) / 1000);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          is_online: false,
          worked_seconds_today: { increment: sessionSeconds }, // اضافه کردن به سابقه امروز
          last_active_at: null
        }
      });
    } else {
      // 🟢 ادمین دکمه "شروع کار" را زده است
      await prisma.user.update({
        where: { id: user.id },
        data: {
          is_online: true,
          last_active_at: new Date() // ثبت زمان شروع
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}