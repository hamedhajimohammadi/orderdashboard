// components/supervisor/SLATimer.js
'use client';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function SLATimer({ startTime, type }) {
  // تنظیم مدت زمان مجاز
  // سفارش عادی: ۳۰ دقیقه | استرداد: ۴۸ ساعت
  const limitMs = type === 'refund' ? 48 * 60 * 60 * 1000 : 30 * 60 * 1000;
  
  const calculateTimeLeft = () => {
    const now = Date.now();
    const deadline = startTime + limitMs;
    const difference = deadline - now;
    return difference;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000); // آپدیت هر ثانیه
    return () => clearInterval(timer);
  }, [startTime]);

  // فرمت دهی نمایش
  const formatTime = (ms) => {
    if (ms < 0) return "منقضی شده";
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (type === 'refund') return `${hours}س : ${minutes}د`; // برای استرداد ساعت و دقیقه کافیه
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; // برای سفارش دقیقه و ثانیه
  };

  // تعیین رنگ وضعیت
  let colorClass = "bg-emerald-100 text-emerald-700";
  const percentageLeft = (timeLeft / limitMs) * 100;
  
  if (timeLeft < 0) colorClass = "bg-gray-800 text-white animate-pulse"; // منقضی
  else if (percentageLeft < 20) colorClass = "bg-red-100 text-red-600 animate-pulse"; // اضطراری
  else if (percentageLeft < 50) colorClass = "bg-amber-100 text-amber-700"; // هشدار

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-bold w-fit ${colorClass}`}>
      <Clock size={12} />
      <span dir="ltr">{formatTime(timeLeft)}</span>
    </div>
  );
}