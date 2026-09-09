import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const ExpandableContent = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!content) return null;

  const isArray = Array.isArray(content);

  return (
    <div className="mt-4 space-y-3">
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
                className="flex items-start gap-2.5 text-xs text-slate-300 sm:text-sm"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                <span className="leading-relaxed text-slate-200">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="whitespace-pre-line text-xs leading-relaxed text-slate-300 sm:text-sm sm:leading-7">
            {String(content)}
          </p>
        )}

        {!isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-400 transition-colors hover:text-emerald-300 focus:outline-none"
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
      badgeColor: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
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
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.35)] backdrop-blur-md sm:p-6">
      <div className="grid gap-4 sm:gap-5">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <div
              key={section.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all duration-200 hover:border-slate-700/80 hover:bg-slate-950"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border ${section.badgeColor}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-slate-100">
                  {section.title}
                </h4>
              </div>

              <ExpandableContent content={section.content} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default EventDescription;
