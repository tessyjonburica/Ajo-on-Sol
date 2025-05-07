"use client"

import type { ReactNode } from "react"
import { motion, type MotionProps } from "framer-motion"

interface MotionWrapperProps extends MotionProps {
  children: ReactNode
  className?: string
  delay?: number
}

/**
 * A wrapper component that applies consistent motion animations
 * to its children using Framer Motion
 */
export function MotionWrapper({ children, className, delay = 0, ...motionProps }: MotionWrapperProps) {
  const defaultAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: "easeOut" },
    ...motionProps,
  }

  return (
    <motion.div className={className} {...defaultAnimation}>
      {children}
    </motion.div>
  )
}

/**
 * A wrapper for items in a list that applies staggered animations
 */
export function MotionListItem({
  children,
  className,
  index = 0,
  ...motionProps
}: MotionWrapperProps & { index?: number }) {
  const defaultAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: index * 0.1, ease: "easeOut" },
    ...motionProps,
  }

  return (
    <motion.div className={className} {...defaultAnimation}>
      {children}
    </motion.div>
  )
}

/**
 * A wrapper for page transitions
 */
export function MotionPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * A wrapper for modal animations
 */
export function MotionModal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
