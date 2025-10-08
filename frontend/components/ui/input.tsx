import * as React from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const base = "flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none";
    return <input ref={ref} className={clsx(base, className)} {...props} />;
  }
);
Input.displayName = "Input";

