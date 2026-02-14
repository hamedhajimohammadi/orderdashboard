import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // این خط باعث می‌شود استایل‌های پوشه app کار کنند
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        // اگر فونت فارسی دارید اینجا اضافه می‌شود، فعلا مهم نیست
        sans: ['var(--font-vazir)', 'ui-sans-serif', 'system-ui'],
      }
    },
  },
  plugins: [],
};
export default config;