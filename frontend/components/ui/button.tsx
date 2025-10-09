"use client";
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const base = "inline-flex items-center justify-center rounded-md min-h-[44px] text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:pointer-events-none";
const variants: Record<string, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-border bg-white text-foreground hover:border-blue-500",
  ghost: "text-blue-600 hover:underline",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "secondary", ...props }, ref
) {
  const cls = [base, variants[variant] || variants.secondary, className].filter(Boolean).join(" ");
  return <button ref={ref} className={cls} {...props} />;
});

export default Button;

