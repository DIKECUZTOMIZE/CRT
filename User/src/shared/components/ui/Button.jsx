import React from "react";

import { cn } from "../../utils/cn";

export const Button = ({
  children,
  variant = "primary", // "primary" | "secondary" | "outline" | "ghost" | "danger"
  size = "md", // "sm" | "md" | "lg"
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-150 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.95] touch-manipulation overflow-hidden shrink-0";

  const sizeStyles = {
    sm: "px-2 py-1 text-[10px] sm:text-xs gap-1 h-7 sm:h-7.5",
    md: "px-2.5 py-1 text-[11px] sm:text-xs gap-1.5 h-8 sm:h-8.5",
    lg: "px-3.5 py-1.5 text-xs sm:text-sm gap-2 h-9 sm:h-10",
  };

  const variantStyles = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[0_2px_10px_-2px_rgba(16,185,129,0.35)] active:shadow-none border border-emerald-400/20",
    secondary:
      "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-glow)] backdrop-blur-md active:bg-slate-800",
    outline:
      "bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[#34d399] active:bg-[var(--color-primary-soft)]",
    ghost:
      "bg-transparent text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] active:bg-slate-800/80",
    danger:
      "bg-[var(--color-danger)] text-white hover:bg-red-600 shadow-[0_2px_10px_-2px_rgba(239,68,68,0.35)] active:shadow-none border border-red-400/20",
  };

  const iconClassName =
    "shrink-0 flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3 sm:[&>svg]:w-3.5 sm:[&>svg]:h-3.5";

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        leftIcon && <span className={iconClassName}>{leftIcon}</span>
      )}

      {children && <span className="truncate leading-none">{children}</span>}

      {!isLoading && rightIcon && <span className={iconClassName}>{rightIcon}</span>}
    </button>
  );
};