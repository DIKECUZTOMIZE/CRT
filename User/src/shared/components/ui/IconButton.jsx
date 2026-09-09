import React from "react";

export const IconButton = ({
  icon,
  variant = "secondary", // "primary" | "secondary" | "ghost" | "outline"
  size = "md", // "sm" | "md" | "lg"
  ariaLabel,
  className = "",
  ...props
}) => {
  // Extra-Compact Mobile-First Sizes & Icon Scaling
  const sizeStyles = {
    sm: "w-6.5 h-6.5 sm:w-7 sm:h-7 [&>svg]:w-3 [&>svg]:h-3 sm:[&>svg]:w-3.5 sm:[&>svg]:h-3.5",
    md: "w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4",
    lg: "w-8.5 h-8.5 sm:w-10 sm:h-10 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5",
  };

  const variantStyles = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[0_2px_8px_-2px_rgba(16,185,129,0.35)] active:shadow-none border border-emerald-400/20",
    secondary:
      "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-white hover:border-[var(--color-border-glow)] backdrop-blur-md active:bg-slate-800",
    ghost:
      "bg-transparent text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] active:bg-slate-800/80",
    outline:
      "bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-white active:bg-[var(--color-primary-soft)]",
  };

  return (
    <button
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed select-none shrink-0 touch-manipulation ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};