import { motion, useReducedMotion } from "framer-motion"
import { GlassCard, type GlassCardProps } from "./glass-card"

export const GlassCardMotion = ({
  children,
  ...props
}: GlassCardProps) => {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <GlassCard {...props}>{children}</GlassCard>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      <GlassCard {...props}>{children}</GlassCard>
    </motion.div>
  )
}
