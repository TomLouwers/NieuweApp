"use client";
import React from "react";
import { CSSTransition, SwitchTransition } from "react-transition-group";

type Direction = "forward" | "back";

export interface SlideContainerProps {
  direction: Direction;
  children: React.ReactNode;
  nodeKey?: React.Key;
  className?: string;
}

/**
 * SlideContainer applies directional slide transitions to its children.
 * Uses translateX transforms for 60fps animations.
 */
export default function SlideContainer({ direction, children, nodeKey, className }: SlideContainerProps) {
  const classNames = direction === "forward" ? "slide-forward" : "slide-back";
  const key = nodeKey ?? (React.isValidElement(children) ? (children as any).key ?? 0 : 0);

  return (
    <div className={className} style={{ position: "relative" }}>
      <SwitchTransition>
        <CSSTransition key={String(key)} classNames={classNames} timeout={300} unmountOnExit>
          <div style={{ willChange: "transform, opacity" }}>{children}</div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
}

