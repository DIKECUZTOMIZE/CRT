import React from "react";

export const BackButton = ({
  onClick,
  label = "Back",
  showLabelOnMobile = false,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-7.5 sm:h-8 px-2.5 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-white hover:border-[var(--color-border-glow)] active:scale-95 transition-all duration-150 text-xs font-medium shrink-0 ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span className={showLabelOnMobile ? "inline" : "hidden sm:inline"}>{label}</span>
    </button>
  );
};