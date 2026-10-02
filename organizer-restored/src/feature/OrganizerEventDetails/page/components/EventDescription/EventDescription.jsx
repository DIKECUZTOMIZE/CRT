import React from "react";
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

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
    <DetailAccordion
      title="Event Description"
      icon={Sparkles}
      initialOpen={false}
      viewLabel="View details"
      hideLabel="Hide details"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="grid min-w-0 gap-4 sm:gap-5">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <div
              key={section.id}
              className="min-w-0 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all duration-200 hover:border-slate-700/80 hover:bg-slate-950"
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

              {Array.isArray(section.content) ? (
                <ul className="mt-4 space-y-2.5 pl-1">
                  {section.content.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex min-w-0 items-start gap-2.5 text-xs text-slate-300 sm:text-sm"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                      <span className="min-w-0 flex-1 leading-relaxed text-slate-200 break-words [overflow-wrap:anywhere]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 min-w-0 whitespace-pre-line break-words text-xs leading-relaxed text-slate-300 [overflow-wrap:anywhere] sm:text-sm sm:leading-7">
                  {String(section.content)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </DetailAccordion>
  );
};

export default EventDescription;
