"use client";
import { useState, useEffect } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import StatsModal from "./StatsModal";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardHeader({ onSearch }) {
  const { isOnline, toggleOnline, lastLoginTime, totalOnlineSeconds, dailyStats, currentUser } = useOrderStore();
  const pathname = usePathname();
  
  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    let interval;
    const updateTimer = () => {
      const now = Date.now();
      const currentSessionSeconds = isOnline && lastLoginTime ? Math.floor((now - lastLoginTime) / 1000) : 0;
      const totalSeconds = totalOnlineSeconds + currentSessionSeconds;
      
      const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      setDisplayTime(`${h}:${m}:${s}`);
    };
    updateTimer();
    if (isOnline) interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOnline, lastLoginTime, totalOnlineSeconds]);

  const currentCount = dailyStats?.completed || 0;
  const targetCount = dailyStats?.target || 25;
  const bonusAmount = Math.max(0, currentCount - targetCount) * (dailyStats?.bonusRate || 5000);
  const progressPercent = Math.min(100, (currentCount / targetCount) * 100);

  // لینک‌های ناوبری
  const navLinks = [];

  if (currentUser?.role === 'administrator') {
    navLinks.push(
      { href: '/admin/users', label: 'کاربران', icon: '👥' },
      { href: '/supervisor', label: 'نظارت', icon: '👀' }
    );
  } else if (currentUser?.role === 'supervisor') {
    navLinks.push(
      { href: '/supervisor', label: 'نظارت', icon: '👀' }
    );
  }

  return (
    <>
    <header className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col xl:flex-row justify-between items-center gap-6 sticky top-2 z-40 transition-all">
      
      {/* 🟢 راست: دکمه بزرگ و لمسی + تایمر */}
      <div className="flex items-center gap-5 w-full xl:w-auto justify-between xl:justify-start">
        
        {/* دکمه تاگل بزرگ شده (Touch Friendly) */}
        <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={toggleOnline}>
            <div 
                className={`relative w-16 h-9 rounded-full p-1 transition-all duration-300 shadow-inner flex items-center ${isOnline ? 'bg-emerald-500 shadow-emerald-200' : 'bg-gray-300'}`}
                title={isOnline ? "لمس کنید تا استراحت کنید" : "لمس کنید تا آنلاین شوید"}
            >
                {/* دایره سفید داخل دکمه */}
                <div className={`absolute bg-white w-7 h-7 rounded-full shadow-md transform transition-transform duration-300 ease-out ${isOnline ? 'translate-x-[-30px]' : 'translate-x-0'}`}></div>
            </div>
            <span className={`text-[11px] font-bold select-none ${isOnline ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                {isOnline ? '🟢 آنلاین' : '🔴 استراحت'}
            </span>
        </div>
        
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-gray-800 flex items-center gap-2 tracking-tight">
                    داشبورد
                </h1>
                {currentUser && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold border border-blue-100">
                        {currentUser.display_name || currentUser.username}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200 w-fit mt-1">
                <span>⏱️ کارکرد:</span>
                <span className="font-bold text-blue-600">{displayTime}</span>
            </div>
        </div>
      </div>

      {/* 🧭 وسط: منوی ناوبری (جدید) */}
      <nav className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 overflow-x-auto max-w-full no-scrollbar">
        {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
                <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                        ${isActive 
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200' 
                            : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                        }
                    `}
                >
                    <span className="text-base">{link.icon}</span>
                    <span>{link.label}</span>
                </Link>
            );
        })}
      </nav>

      {/* 🎯 چپ: ویجت تارگت */}
      <div className="w-full xl:w-auto flex-1 px-0 xl:px-4">
         <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 w-full shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-2/3 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>📅 سهمیه امروز:</span>
                    <span>{currentCount} <span className="text-slate-400">/</span> {targetCount}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.3)] ${progressPercent >= 100 ? 'bg-amber-500' : 'bg-blue-600'}`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-200"></div>
            <div className="w-full md:w-1/3 flex md:flex-col justify-between md:justify-center items-center gap-1 bg-white md:bg-transparent p-2 md:p-0 rounded-xl border md:border-none border-slate-100">
                <span className="text-xs text-slate-500 font-medium">پاداش:</span>
                <span className={`font-black text-sm tracking-tight drop-shadow-sm ${bonusAmount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {bonusAmount.toLocaleString()} <span className="text-[10px]">ت</span>
                </span>

            </div>
         </div>
      </div>
      
      {/* 🔴 چپ: خروج */}
      <button 
          onClick={async () => {
              if(!confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) return;
              try {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login';
              } catch(e) { console.error(e); }
          }}
          className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-3 rounded-xl text-sm font-bold transition border border-red-100 flex items-center gap-2 w-full xl:w-auto justify-center"
      >
          <span>خروج از حساب</span>
          <span>🚪</span>
      </button>
    </header>
    {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </>
  );
}