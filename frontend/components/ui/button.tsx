import * as React from "react";
import clsx from "clsx";

type Variant = "default" | "outline";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2";
    const styles =
      variant === "outline"
        ? "border border-border bg-transparent text-foreground hover:bg-gray-50"
        : "bg-blue-600 text-white hover:bg-blue-700";
    return <button ref={ref} className={clsx(base, styles, className)} {...props} />;
  }
);
Button.displayName = "Button";

