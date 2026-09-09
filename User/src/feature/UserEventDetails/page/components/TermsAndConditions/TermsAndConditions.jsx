import React from "react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

export const TermsAndConditions = ({
  terms = [],
  initialOpen = false,
  title = "Rules & Regulations",
  countLabel = "Rules",
  toggleLabel = "rules",
}) => {
  if (!Array.isArray(terms) || terms.length === 0) return null;

  return (
    <DetailAccordion
      title={title}
      badge={`${terms.length} ${countLabel}`}
      icon={ShieldCheck}
      initialOpen={initialOpen}
      viewLabel={`View ${toggleLabel}`}
      hideLabel={`Hide ${toggleLabel}`}
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="stack-list stack-list--dense">
        {terms.map((term, idx) => {
          const ruleText =
            typeof term === "object" && term !== null
              ? term.text || term.rule || term.type
              : term;

          const label =
            typeof term === "object" && term !== null && term.type
              ? term.type
              : "";

          return (
            <div key={idx} className="check-row">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" />
              <div className="space-y-0.5">
                {label && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    {label}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-slate-300">{ruleText}</p>
              </div>
            </div>
          );
        })}
      </div>
    </DetailAccordion>
  );
};

export default TermsAndConditions;