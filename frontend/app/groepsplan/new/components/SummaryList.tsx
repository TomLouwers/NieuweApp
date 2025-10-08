"use client";
import React from "react";
import clsx from "clsx";

type Variant = "summary" | "checkmark";

export interface SummaryListProps {
  items: React.ReactNode[];
  variant?: Variant;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export default function SummaryList({ items, variant = "summary", className, as = "ul" }: SummaryListProps) {
  const ListTag: any = as;
  return (
    <ListTag className={clsx("space-y-2", className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className={variant === "checkmark" ? "checkmark-item" : "summary-item"}
          style={{ ["--index" as any]: i } as React.CSSProperties}
        >
          {variant === "checkmark" ? (
            <span className="inline-flex items-start gap-2">
              <span aria-hidden className="text-green-600">✓</span>
              <span>{item}</span>
            </span>
          ) : (
            item
          )}
        </li>
      ))}
    </ListTag>
  );
}

