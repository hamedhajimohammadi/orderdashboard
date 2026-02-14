function getIranStartOfDay() {
  const now = new Date();
  // Iran is UTC+3:30
  const iranOffset = 3.5 * 60 * 60 * 1000;
  const iranTime = new Date(now.getTime() + iranOffset);
  
  // Reset to midnight
  iranTime.setUTCHours(0, 0, 0, 0);
  
  // Convert back to UTC
  return new Date(iranTime.getTime() - iranOffset);
}

console.log("Server Now (UTC):", new Date().toISOString());
console.log("Iran Start of Day (UTC):", getIranStartOfDay().toISOString());
