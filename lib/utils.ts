// پچ کردن BigInt برای جلوگیری از ارور JSON
// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() }

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getIranStartOfDay() {
  const now = new Date();
  // Iran is UTC+3:30
  const iranOffset = 3.5 * 60 * 60 * 1000;
  const iranTime = new Date(now.getTime() + iranOffset);
  
  // Reset to midnight
  iranTime.setUTCHours(0, 0, 0, 0);
  
  // Convert back to UTC
  return new Date(iranTime.getTime() - iranOffset);
}
