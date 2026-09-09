import React from "react";
import { ListOrdered } from "lucide-react";
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

export const HowToJoin = ({ steps = [], initialOpen = false }) => {
  const defaultSteps = [
    "To participate or get more details about the event, contact the organizer on WhatsApp.",
    "Discuss your participation, event details and eligibility with the organizer.",
    "The organizer will review and accept your participation request.",
    "After your participation is accepted, complete the registration/payment process offline as instructed by the organizer.",
  ];

  const listToRender =
    Array.isArray(steps) && steps.length > 0 ? steps : defaultSteps;

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