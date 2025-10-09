"use client";
import * as React from "react";

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // no extra props
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className = "", ...props }, ref
) {
  const cls = [
    "h-2 w-full appearance-none bg-transparent",
    className,
  ].join(" ");
  return (
    <input ref={ref} type="range" className={cls} {...props} />
  );
});

export default Slider;

