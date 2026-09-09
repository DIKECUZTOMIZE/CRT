import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const DetailAccordion = ({
  title,
  badge,
  icon: Icon,
  initialOpen = false,
  children,
  viewLabel = "View details",
  hideLabel = "Hide details",
  iconClassName = "",
  badgeClassName = "",
  bodyClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.35)] backdrop-blur-md sm:p-5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-200 ${iconClassName}`}>
              <Icon className="h-4 w-4 text-emerald-400" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{title}</div>
            {badge && (
              <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${badgeClassName || "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`}>
                {badge}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
          <span>{isOpen ? hideLabel : viewLabel}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className={`mt-4 ${bodyClassName}`}>
          {children}
        </div>
      )}
    </section>
  );
};

export default DetailAccordion;
