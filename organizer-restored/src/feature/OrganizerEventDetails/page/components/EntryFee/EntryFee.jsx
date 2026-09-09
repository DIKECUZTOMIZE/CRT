import React from "react";
import { Ticket, Sparkles, AlertCircle } from "lucide-react";
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";
import { formatCurrency } from "../../../utils/eventDetailsUtils";

export const EntryFee = ({ entryFee, initialOpen = false }) => {
  if (!entryFee) return null;

  const categories = Array.isArray(entryFee.categories)
    ? entryFee.categories.filter(
        (cat) =>
          cat &&
          (cat.label || cat.name || cat.category) &&
          cat.amount !== undefined &&
          cat.amount !== null
      ).map((cat) => ({
        ...cat,
        label: cat.label || cat.name || cat.category || "Entry",
      }))
    : [];

  const isFree = Boolean(entryFee.isFree) || (categories.length === 0 && Number(entryFee.amount) === 0);

  if (categories.length === 0 && !isFree && entryFee.amount === undefined) {
    return null;
  }

  const getHeaderBadge = () => {
    if (isFree && categories.length === 0) return "Free Entry";
    if (categories.length > 0) return `${categories.length} Tiers`;
    return formatCurrency(Number(entryFee.amount || 0), entryFee.currency || "INR");
  };

  return (
    <DetailAccordion
      title="Entry Fee Structure"
      badge={getHeaderBadge()}
      icon={Ticket}
      initialOpen={initialOpen}
      viewLabel="View fees"
      hideLabel="Hide details"
      iconClassName="panel-icon--emerald"
      badgeClassName="panel-badge--emerald"
      bodyClassName="panel-body--stacked"
    >
      {isFree && categories.length === 0 && (
        <div className="info-pill info-pill--success">
          <div className="info-pill__content">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Free Event Entry</span>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-300">₹0 / Free</span>
        </div>
      )}

      {categories.length > 0 && (
        <div className="stack-list">
          {categories.map((cat, idx) => {
            const amount = Number(cat.amount);
            const currency = cat.currency || "INR";

            return (
              <div key={cat.id || idx} className="stack-item">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-bold text-slate-200">{cat.label}</p>
                    {cat.isPopular && (
                      <span className="pill badge-amber">Popular</span>
                    )}
                  </div>

                  {cat.description && (
                    <p className="mt-0.5 text-[9px] font-medium leading-relaxed text-slate-400">
                      {cat.description}
                    </p>
                  )}
                </div>

                <span className="shrink-0 text-xs font-black text-emerald-400 sm:text-sm">
                  {amount === 0 ? "Free" : formatCurrency(amount, currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!isFree && categories.length === 0 && entryFee.amount !== undefined && (
        <div className="stack-item">
          <span className="text-xs font-bold text-slate-300">Standard Entry</span>
          <span className="text-xs font-black text-emerald-400 sm:text-sm">
            {formatCurrency(Number(entryFee.amount), entryFee.currency || "INR")}
          </span>
        </div>
      )}

      {entryFee.note && (
        <div className="info-note">
          <div className="info-note__content">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400/80" />
            <p className="text-[10px] leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-300">Note:</span> {entryFee.note}
            </p>
          </div>
        </div>
      )}
    </DetailAccordion>
  );
};

export default EntryFee;