"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { duration: reduceMotion ? 0.12 : 0.2, ease: "easeOut" },
        }}
        exit={{
          opacity: 0,
          y: reduceMotion ? 0 : -4,
          transition: { duration: 0.15, ease: "easeIn" },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
