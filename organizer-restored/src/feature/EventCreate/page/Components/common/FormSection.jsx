import React from "react";

export default function FormSection({
  icon: Icon,
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <div
      className={`form-section-shell rounded-2xl border border-white/10 bg-[#0b0b0b] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all sm:p-7 ${className}`}
    >
      {/* SECTION HEADER */}
      {(title || Icon || action) && (
        <div className="form-section-header mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5 sm:mb-6">
          <div className="space-y-0.5">
            {title && (
              <h2 className="form-section-title flex items-center gap-2 text-sm font-semibold sm:text-base">
                {Icon && (
                  <Icon className="h-4 w-4 shrink-0 text-emerald-400 sm:h-5 sm:w-5" />
                )}
                <span>{title}</span>
              </h2>
            )}
            {description && (
              <p className="form-section-description text-[11px] sm:text-xs">
                {description}
              </p>
            )}
          </div>

          {/* Optional right action slot (e.g. Yes/No dropdown toggle) */}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* SECTION CONTENT BODY */}
      <div>{children}</div>
    </div>
  );
}