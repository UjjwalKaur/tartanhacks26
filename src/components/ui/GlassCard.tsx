import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  animateIn?: boolean; // renamed so it doesn't clash conceptually with framer's animate prop
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = "", hover = false, animateIn = false, ...props }, ref) => {
    const baseClasses = "glass-card";
    const hoverClasses = hover ? "glass-card-hover cursor-pointer" : "";
    const classes = `${baseClasses} ${hoverClasses} ${className}`;

    return (
      <motion.div
        ref={ref}
        className={classes}
        // only apply enter animation when requested
        initial={animateIn ? { opacity: 0, y: 20 } : false}
        animate={animateIn ? { opacity: 1, y: 0 } : undefined}
        transition={animateIn ? { type: "spring", stiffness: 300, damping: 30 } : undefined}
        whileHover={hover ? { scale: 1.02 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

