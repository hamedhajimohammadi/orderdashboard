import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-me';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. مسیرهای عمومی که نیاز به احراز هویت ندارند
  const publicPaths = ['/login', '/api/login', '/api/webhook', '/api/cron'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. نادیده گرفتن فایل‌های استاتیک (اگر در matcher تنظیم نشده باشند)
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') || 
    pathname.startsWith('/sounds') || 
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 3. دریافت و بررسی توکن
  const token = request.cookies.get('adminToken')?.value;

  if (!token) {
    // اگر درخواست API است، 401 برگردان
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // در غیر این صورت به صفحه لاگین ریدایرکت کن
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // 4. کنترل دسترسی بر اساس نقش (RBAC)

    // --- نقش: Administrator ---
    // دسترسی کامل دارد، پس چک خاصی نیاز نیست (مگر اینکه بخواهیم خیلی سخت‌گیر باشیم)
    if (role === 'administrator' || role === 'admin') {
      return NextResponse.next();
    }

    // --- نقش: Supervisor ---
    if (role === 'supervisor') {
      // سوپروایزر نباید به مدیریت کاربران دسترسی داشته باشد
      if (pathname.startsWith('/admin/users')) {
        if (pathname.startsWith('/api/')) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        return NextResponse.redirect(new URL('/', request.url));
      }
      // سوپروایزر به پنل خودش و میز کار دسترسی دارد
      return NextResponse.next();
    }

    // --- نقش: Operator (و سایر نقش‌ها) ---
    // اپراتور نباید به هیچ بخش ادمین یا سوپروایزر دسترسی داشته باشد
    if (pathname.startsWith('/admin') || pathname.startsWith('/supervisor')) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      return NextResponse.redirect(new URL('/', request.url));
    }

    // دسترسی پیش‌فرض برای اپراتور (میز کار /)
    return NextResponse.next();

  } catch (error) {
    // توکن نامعتبر یا منقضی شده
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    // حذف کوکی نامعتبر
    response.cookies.delete('adminToken');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
