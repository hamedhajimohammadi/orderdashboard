"use client";
import { useState, useEffect } from "react";

export default function OrderTimer({ dateCreated }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState("normal"); // normal, warning, late

  useEffect(() => {
    if (!dateCreated) return;

    const getTimestamp = (inputDate) => {
      if (inputDate instanceof Date) return inputDate.getTime();
      if (typeof inputDate === 'string') {
        // Ensure it's treated as UTC if no timezone is specified
        const safeDateString = inputDate.endsWith("Z") ? inputDate : `${inputDate}Z`;
        return new Date(safeDateString).getTime();
      }
      return Date.now();
    };

    const orderTime = getTimestamp(dateCreated);
    const DEADLINE_MS = 30 * 60 * 1000; // 30 Minutes
    const targetTime = orderTime + DEADLINE_MS;

    const updateTimer = () => {
      const now = Date.now();
      const distance = targetTime - now; // Positive = Time Remaining, Negative = Overdue

      // Status Logic
      if (distance < 0) {
        setStatus("late");
      } else if (distance < (DEADLINE_MS * 0.3)) { // Last 30% (9 mins)
        setStatus("warning");
      } else {
        setStatus("normal");
      }

      // Formatting
      const absDistance = Math.abs(distance);
      const hours = Math.floor(absDistance / (1000 * 60 * 60));
      const minutes = Math.floor((absDistance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDistance % (1000 * 60)) / 1000);

      const formattedTime = `${hours > 0 ? hours + ':' : ''}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      
      setTimeLeft(distance < 0 ? `+${formattedTime}` : formattedTime);
    };

    updateTimer(); // Initial run
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [dateCreated]);

  const colorClass = 
    status === "late" ? "text-red-600 bg-red-50 border-red-100 animate-pulse" :
    status === "warning" ? "text-amber-600 bg-amber-50 border-amber-100" :
    "text-emerald-600 bg-emerald-50 border-emerald-100";

  if (!timeLeft) return <span className="text-xs text-gray-300">...</span>;

  return (
    <div className={`px-2 py-1 rounded border text-xs font-mono font-bold flex items-center gap-1 ${colorClass}`}>
      <span>⏱</span>
      <span dir="ltr">{timeLeft}</span>
    </div>
  );
}
