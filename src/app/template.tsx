"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { easeStandard, motionDuration } from "@/lib/motion";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0.72 }}
      animate={{ opacity: 1 }}
      transition={{ duration: motionDuration.fast, ease: easeStandard }}
    >
      {children}
    </motion.div>
  );
}
