"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AnimatedAlertProps {
  type: "success" | "error" | "warning" | "info"
  title?: string
  message: string | null
  onDismiss?: () => void
  autoDismiss?: boolean
  dismissTimeout?: number
  className?: string
}

/**
 * A reusable animated alert component for success, error, warning, and info messages
 */
export default function AnimatedAlert({
  type,
  title,
  message,
  onDismiss,
  autoDismiss = true,
  dismissTimeout = 5000,
  className,
}: AnimatedAlertProps) {
  // Auto-dismiss the alert after the specified timeout
  useEffect(() => {
    if (message && autoDismiss && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss()
      }, dismissTimeout)
      return () => clearTimeout(timer)
    }
  }, [message, autoDismiss, dismissTimeout, onDismiss])

  if (!message) return null

  const getAlertStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "error":
        return ""
      case "warning":
        return "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "info":
        return "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      default:
        return ""
    }
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4" />
      case "error":
        return <X className="h-4 w-4" />
      case "warning":
        return <X className="h-4 w-4" />
      case "info":
        return <Check className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          <Alert
            variant={type === "error" ? "destructive" : "default"}
            className={type !== "error" ? getAlertStyles() : ""}
          >
            {getIcon()}
            <AlertTitle>{title || type.charAt(0).toUpperCase() + type.slice(1)}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
