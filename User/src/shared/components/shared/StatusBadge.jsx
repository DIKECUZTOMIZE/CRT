import React from "react";

export const StatusBadge = ({ status = "upcoming", label, className = "" }) => {
  const statusConfig = {
    live: {
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]",
    },
    upcoming: {
      bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      dot: "bg-amber-400",
    },
    completed: {
      bg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      dot: "bg-blue-400",
    },
    ended: {
      bg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
      dot: "bg-blue-400",
    },
    cancelled: {
      bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
      dot: "bg-rose-400",
    },
    canceled: {
      bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
      dot: "bg-rose-400",
    },
    postponed: {
      bg: "bg-violet-500/10 border-violet-500/30 text-violet-400",
      dot: "bg-violet-400",
    },
    draft: {
      bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
      dot: "bg-slate-400",
    },
  };

  const normalizedStatus = String(status ?? "upcoming").trim().toLowerCase();
  const current = statusConfig[normalizedStatus] || statusConfig.upcoming;
  const displayText = label || normalizedStatus.replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide uppercase leading-none shrink-0 ${current.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} />
      {displayText}
    </span>
  );
};