"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { StoreProvider } from "./store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: 0.11, anchors: { offset: -64 }, respectReducedMotion: true }}>
        <StoreProvider>{children}</StoreProvider>
      </ReactLenis>
    </MotionConfig>
  );
}
