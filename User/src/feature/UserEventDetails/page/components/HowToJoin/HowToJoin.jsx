import React from "react";
import { ListOrdered } from "lucide-react";
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

export const HowToJoin = ({ steps = [], initialOpen = false, open = false, onToggle }) => {
  const listToRender = Array.isArray(steps) ? steps : [];
  if (listToRender.length === 0) return null;

  return (
    <DetailAccordion
      title="How To Participate"
      badge={`${listToRender.length} Steps`}
      icon={ListOrdered}
      initialOpen={initialOpen}
      open={open}
      onToggle={onToggle}
      viewLabel="View steps"
      hideLabel="Hide details"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="stack-list stack-list--dense">
        {listToRender.map((item, idx) => {
          const title = typeof item === "object" && item !== null ? item.title : "";
          const text = typeof item === "object" && item !== null ? item.text : item;

          return (
            <div key={idx} className="step-row">
              <span className="step-number">{idx + 1}</span>
              <div className="min-w-0">
                {typeof title === "string" && title.trim() && (
                  <h3 className="step-text font-semibold uppercase !text-[#059669]">{title}</h3>
                )}
                <p className="step-text">{text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </DetailAccordion>
  );
};

export default HowToJoin;