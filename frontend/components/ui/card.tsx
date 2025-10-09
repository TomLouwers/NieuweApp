"use client";
import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className = "", ...props }, ref
) {
  const base = "rounded-xl border border-border bg-white shadow-sm";
  return <div ref={ref} className={[base, className].join(" ")} {...props} />;
});

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardHeader(
  { className = "", ...props }, ref
) {
  const base = "px-4 py-3 border-b border-border";
  return <div ref={ref} className={[base, className].join(" ")} {...props} />;
});

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(function CardTitle(
  { className = "", ...props }, ref
) {
  const base = "text-lg font-medium";
  return <h3 ref={ref} className={[base, className].join(" ")} {...props} />;
});

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardContent(
  { className = "", ...props }, ref
) {
  const base = "px-4 py-3";
  return <div ref={ref} className={[base, className].join(" ")} {...props} />;
});

export default Card;
