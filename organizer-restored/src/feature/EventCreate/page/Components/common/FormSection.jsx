import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FormSection({
  icon: Icon,
  title,
  description,
  action,
  children,
  className = "",
  onToggle,
  isExpanded = false,
  toggleLabel,
}) {
  const headerContent = (
    <div className="form-section-header mb-4 flex w-full flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 sm:mb-6">
      <div className="space-y-0.5">
        {title && (
          <h2 className="form-section-title flex items-center gap-2 text-sm font-semibold text-slate-100 sm:text-base">
            {Icon && (
              <Icon className="h-4 w-4 shrink-0 text-emerald-400 sm:h-5 sm:w-5" />
            )}
            <span>{title}</span>
          </h2>
        )}
        {description && (
          <p className="form-section-description text-[11px] text-slate-400 sm:text-xs">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );

  const sharedChevron = onToggle ? (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-label={toggleLabel ?? (isExpanded ? `Collapse ${title}` : `Expand ${title}`)}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 text-slate-400 transition-colors hover:border-emerald-500/30 hover:text-[#34D399]"
    >
      {isExpanded ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  ) : null;

  return (
    <div
      className={`form-section-shell rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-all sm:p-7 ${className}`}
    >
      {/* SECTION HEADER */}
      {(title || Icon || action) &&
        (onToggle ? (
          <div
            onClick={onToggle}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggle();
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            aria-label={toggleLabel ?? (isExpanded ? `Collapse ${title}` : `Expand ${title}`)}
            className="form-section-header mb-4 flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 text-left outline-none sm:mb-6"
          >
            <div className="space-y-0.5">
              {title && (
                <h2 className="form-section-title flex items-center gap-2 text-sm font-semibold text-slate-100 sm:text-base">
                  {Icon && (
                    <Icon className="h-4 w-4 shrink-0 text-emerald-400 sm:h-5 sm:w-5" />
                  )}
                  <span>{title}</span>
                </h2>
              )}
              {description && (
                <p className="form-section-description text-[11px] text-slate-400 sm:text-xs">
                  {description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {action && <div>{action}</div>}
              {sharedChevron}
            </div>
          </div>
        ) : (
          headerContent
        ))}

      {/* SECTION CONTENT BODY */}
      <div>{children}</div>
    </div>
  );
}