"use client";
import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className = "", ...props }, ref
) {
  const base = "rounded-xl border-2 border-border bg-white shadow-sm";
  return <div ref={ref} className={[base, className].join(" ")} {...props} />;
});

export default Card;

