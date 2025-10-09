"use client";
import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", children, ...props }, ref
) {
  const base = "border border-border rounded-md px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <select ref={ref} className={[base, className].join(" ")} {...props}>
      {children}
    </select>
  );
});

export default Select;

