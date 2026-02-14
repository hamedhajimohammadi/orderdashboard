import { Vazirmatn } from "next/font/google";
import "./globals.css";

// تنظیم فونت وزیرمتن (بهترین فونت برای پنل‌های فارسی)
const vazir = Vazirmatn({ 
  subsets: ["arabic", "latin"],
  weight: ["100", "300", "400", "700", "900"], // همه وزن‌ها از نازک تا ضخیم
});

export const metadata = {
  title: "داشبورد سفارشات",
  description: "پنل مدیریت سفارشات گیمینگ",
};

export default function RootLayout({ children }) {
   return (
     // 👇 این پراپ suppressHydrationWarning را اینجا اضافه کن
     <html lang="fa" dir="rtl" suppressHydrationWarning>
       <body className={`${vazir.className} bg-gray-50 text-gray-800`}>
         {children}
       </body>
     </html>
   );
}