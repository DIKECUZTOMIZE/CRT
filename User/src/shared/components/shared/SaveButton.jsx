import React from "react";

export const SaveButton = ({
  isSaved = false,
  onToggle,
  className = "",
  size = "md",
}) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isSaved ? "Unsave item" : "Save item"}
      className={`inline-flex items-center justify-center rounded-lg border transition-all duration-150 active:scale-90 shrink-0 ${
        isSaved
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white"
      } ${size === "sm" ? "w-7 h-7" : "w-8 h-8"} ${className}`}
    >
      <svg
        className={`${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} transition-transform duration-150`}
        fill={isSaved ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
};