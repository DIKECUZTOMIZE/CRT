import React from "react";
import { ListOrdered } from "lucide-react";
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

export const HowToJoin = ({ steps = [], initialOpen = false }) => {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const listToRender = steps;

  return (
    <DetailAccordion
      title="How To Participate"
      badge={`${listToRender.length} Steps`}
      icon={ListOrdered}
      initialOpen={initialOpen}
      viewLabel="View steps"
      hideLabel="Hide details"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="stack-list stack-list--dense">
        {listToRender.map((item, idx) => {
          const text = typeof item === "object" && item !== null ? item.text : item;

          return (
            <div key={idx} className="step-row">
              <span className="step-number">{idx + 1}</span>
              <p className="step-text">{text}</p>
            </div>
          );
        })}
      </div>
    </DetailAccordion>
  );
};

export default HowToJoin;