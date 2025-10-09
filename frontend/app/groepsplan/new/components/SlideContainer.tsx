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
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const outerClass = ["w-full overflow-x-hidden", className].filter(Boolean).join(" ");

  return (
    <div className={outerClass} style={{ position: "relative" }}>
      <SwitchTransition>
        <CSSTransition key={String(key)} classNames={classNames} timeout={300} unmountOnExit nodeRef={nodeRef}>
          <div
            ref={nodeRef}
            className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-4 sm:py-8 text-[16px]"
            style={{ willChange: "transform, opacity" }}
          >
            {children}
          </div>
        </CSSTransition>
      </SwitchTransition>
      <style jsx>{`
        /* Use transform-based slide animations for 60fps */
        .slide-forward-enter { opacity: 0.01; transform: translateX(24px); }
        .slide-forward-enter-active { opacity: 1; transform: translateX(0); transition: transform 300ms ease, opacity 300ms ease; }
        .slide-forward-exit { opacity: 1; transform: translateX(0); }
        .slide-forward-exit-active { opacity: 0.01; transform: translateX(-24px); transition: transform 300ms ease, opacity 300ms ease; }

        .slide-back-enter { opacity: 0.01; transform: translateX(-24px); }
        .slide-back-enter-active { opacity: 1; transform: translateX(0); transition: transform 300ms ease, opacity 300ms ease; }
        .slide-back-exit { opacity: 1; transform: translateX(0); }
        .slide-back-exit-active { opacity: 0.01; transform: translateX(24px); transition: transform 300ms ease, opacity 300ms ease; }
      `}</style>
    </div>
  );
}
