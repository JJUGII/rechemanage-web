import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Malgun Gothic", "맑은 고딕", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
