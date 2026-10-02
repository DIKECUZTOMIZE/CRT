import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

const ExpandableContent = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!content) return null;

  const isArray = Array.isArray(content);

  return (
    <div className="mt-3 space-y-3">
      <div
        className={`relative overflow-hidden transition-all duration-300 ease-in-out ${
          !isExpanded ? "max-h-28" : "max-h-[1200px]"
        }`}
      >
        {isArray ? (
          <ul className="space-y-2.5 pl-1">
            {content.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm leading-7 text-slate-600 sm:text-[15px]"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600" />
                <span className="leading-relaxed text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-[15px] sm:leading-8">
            {String(content)}
          </p>
        )}

        {!isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 transition-colors hover:text-emerald-600 focus:outline-none"
      >
        <span>{isExpanded ? "Show Less" : "Read More"}</span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
};

export const EventDescription = ({ description }) => {
  if (!description) {
    return null;
  }

  const isStructuredDescription =
    typeof description === "object" && !Array.isArray(description);
  const structuredDescription = isStructuredDescription ? description : {};
  const whatIsThis =
    structuredDescription.whatIsThis || structuredDescription.tagline || "";
  const about =
    structuredDescription.about ||
    structuredDescription.description ||
    structuredDescription.summary ||
    "";
  const whatToPrepare =
    structuredDescription.whatToPrepare ||
    structuredDescription.prepare ||
    structuredDescription.customSeatDetails ||
    "";

  const sections = [
    typeof description === "string" &&
      description.trim() && {
        id: "description",
        title: "Description",
        icon: FileText,
        content: description,
        badgeColor: "border-sky-500/20 bg-sky-500/10 text-sky-400",
      },
    whatIsThis && {
      id: "whatIsThis",
      title: "Overview",
      icon: HelpCircle,
      content: whatIsThis,
      badgeColor: "border-emerald-200 bg-[#ECFDF5] text-emerald-700",
    },
    about && {
      id: "about",
      title: "About the Event",
      icon: FileText,
      content: about,
      badgeColor: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    },
    whatToPrepare && {
      id: "whatToPrepare",
      title: "What to Prepare",
      icon: CheckCircle2,
      content: whatToPrepare,
      badgeColor: "border-violet-500/20 bg-violet-500/10 text-violet-400",
    },
  ].filter(Boolean);

  if (sections.length === 0) {
    return null;
  }

  return (
    <DetailAccordion
      title="Description"
      icon={FileText}
      initialOpen={false}
      viewLabel="View details"
      hideLabel="Hide details"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_12px_28px_rgba(15,118,110,0.06)] sm:p-5">
        <div className="space-y-5">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <div key={section.id} className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {section.title}
                  </h4>
                </div>

                <ExpandableContent content={section.content} />
              </div>
            );
          })}
        </div>
      </section>
    </DetailAccordion>
  );
};

export default EventDescription;
