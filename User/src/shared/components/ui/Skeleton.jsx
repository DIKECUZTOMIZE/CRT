import React from "react";

export const Skeleton = ({
  className = "",
  width,
  height,
  circle = false,
  variant = "glass", // "glass" | "subtle"
}) => {
  const variantStyles = {
    glass: "bg-slate-800/50 border border-slate-700/20",
    subtle: "bg-slate-900/40",
  };

  return (
    <div
      className={`animate-pulse will-change-opacity shrink-0 bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 ${
        circle ? "rounded-full" : "rounded-md"
      } ${variantStyles[variant]} ${className}`}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
      }}
    />
  );
};