import type { Transition } from "motion/react";

/** Keep these aligned with the duration tokens in src/styles/tokens.css. */
export const motionDuration = {
  fast: 0.12,
  base: 0.16,
  slow: 0.2,
} as const;

export const easeStandard = [0.2, 0, 0, 1] as const;

export const baseTransition: Transition = {
  duration: motionDuration.base,
  ease: easeStandard,
};
