import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-text";

    const variantClasses = {
      primary: "bg-text text-bg hover:bg-opacity-90 shadow-md hover:shadow-lg",
      secondary: "glass-card hover:border-opacity-50",
      ghost: "hover:bg-glass2",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
