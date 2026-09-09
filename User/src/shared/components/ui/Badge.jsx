import React from "react";

import { cn } from "../../utils/cn";

export const Badge = ({
  children,
  variant = "emerald", // "emerald" | "surface" | "warning" | "danger" | "info" | "outline"
  icon,
  className = "",
  size = "md", // "sm" | "md"
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1 leading-none",
    md: "px-2.5 py-1 text-[11px] sm:text-xs gap-1.5 leading-tight",
  };

  const variantStyles = {
    emerald:
      "bg-[var(--color-primary-soft)] border-emerald-500/30 text-[#34d399] shadow-[0_0_10px_rgba(16,185,129,0.15)]",
    surface:
      "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] shadow-sm",
    warning:
      "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
    danger:
      "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]",
    info:
      "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.15)]",
    outline:
      "bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold tracking-wide rounded-full border backdrop-blur-md select-none shrink-0 max-w-full active:scale-95 transition-transform duration-150",
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {icon && (
        <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex items-center justify-center shrink-0">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </span>
  );
};