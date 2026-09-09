import React from "react";

export const Spinner = ({
  size = "md", // "xs" | "sm" | "md" | "lg"
  color = "primary", // "primary" | "current" | "white"
  className = "",
}) => {
  // Ultra-Compact Mobile-First Sizes
  const sizeMap = {
    xs: "w-3 h-3 border-[1.5px]",
    sm: "w-3.5 h-3.5 sm:w-4 sm:h-4 border-2",
    md: "w-5 h-5 sm:w-6 sm:h-6 border-2",
    lg: "w-7 h-7 sm:w-8 sm:h-8 border-[2.5px]",
  };    

  const colorMap = {
    primary: "border-[var(--color-primary)]/20 border-t-[var(--color-primary)]",
    current: "border-current/20 border-t-current",
    white: "border-white/20 border-t-white",
  };

  return (
    <div
      className={`inline-block rounded-full animate-spin shrink-0 will-change-transform ${sizeMap[size]} ${
        colorMap[color] || color
      } ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
