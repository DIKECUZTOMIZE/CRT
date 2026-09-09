import React from "react";

import { cn } from "../../utils/cn";

export const Input = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = "",
  id,
  size = "md", // "sm" | "md"
  ...props
}) => {
  const heightStyles = {
    sm: "h-7 sm:h-7.5 text-xs",
    md: "h-8 sm:h-8.5 text-xs",
  };

  const leftPadding = leftIcon ? "pl-7.5 sm:pl-8" : "pl-2.5 sm:pl-3";
  const rightPadding = rightIcon ? "pr-7.5 sm:pr-8" : "pr-2.5 sm:pr-3";
  const iconClassName =
    "absolute text-[var(--color-text-muted)] pointer-events-none flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3 sm:[&>svg]:w-3.5 sm:[&>svg]:h-3.5 z-10";

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] tracking-tight leading-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && <div className={cn(iconClassName, "left-2.5 sm:left-3")}>{leftIcon}</div>}

        <input
          id={id}
          className={cn(
            "w-full bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] border border-[var(--color-border)] rounded-lg font-medium transition-all duration-150 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] backdrop-blur-md",
            heightStyles[size],
            leftPadding,
            rightPadding,
            error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]",
            className,
          )}
          {...props}
        />

        {rightIcon && <div className={cn(iconClassName, "right-2.5 sm:right-3")}>{rightIcon}</div>}
      </div>

      {error && (
        <span className="text-[10px] text-[var(--color-danger)] font-medium leading-none">
          {error}
        </span>
      )}
    </div>
  );
};