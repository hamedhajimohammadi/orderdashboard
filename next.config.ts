import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true, // فشرده‌سازی Gzip برای افزایش سرعت بارگذاری
  poweredByHeader: false, // حذف هدر X-Powered-By برای امنیت و کاهش حجم
  reactStrictMode: true, // کمک به شناسایی مشکلات پرفورمنس در توسعه
  
  // بهینه‌سازی ایمیج‌ها (اگر در آینده استفاده کردید)
  images: {
    domains: ['secure.gravatar.com'], // اگر آواتار دارید
    unoptimized: true, // اگر روی سرور خاصی هستید که Image Optimization ساپورت نمیکنه
  },

  // تنظیمات آزمایشی برای توربوپک (بیلد سریع‌تر)
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'], // کاهش حجم باندل نهایی
  },
};

export default nextConfig;
