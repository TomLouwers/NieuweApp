"use client";
import * as React from "react";

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (v: string) => void;
}

export function RadioGroup({ value, onValueChange, className = "", children, ...rest }: RadioGroupProps) {
  return (
    <div role="radiogroup" className={className} {...rest}>
      {children}
    </div>
  );
}

export interface RadioItemProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
}

export function RadioItem({ checked, className = "", ...rest }: RadioItemProps) {
  return <div role="radio" aria-checked={!!checked} tabIndex={checked ? 0 : -1} className={className} {...rest} />;
}

export default { RadioGroup, RadioItem };

