import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background))",
        foreground: "rgb(var(--color-foreground))",
        border: "rgb(var(--color-border))",
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          900: "var(--primary-900)",
        },
        warm: {
          100: "var(--warm-100)",
          500: "var(--warm-500)",
          600: "var(--warm-600)",
        },
        success: {
          100: "var(--success-100)",
          500: "var(--success-500)",
          600: "var(--success-600)",
        },
      },
      borderColor: {
        border: "rgb(var(--color-border))",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      borderRadius: {
        DEFAULT: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
