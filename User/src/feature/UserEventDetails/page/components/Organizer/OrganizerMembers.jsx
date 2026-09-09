import React from "react";
import { Users, Phone } from "lucide-react";
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

export const OrganizerMembers = ({ members = [], initialOpen = false }) => {
  if (!Array.isArray(members) || members.length === 0) return null;

  const limitedMembers = members.slice(0, 3);

  return (
    <DetailAccordion
      title="Organizer Team"
      badge={`${limitedMembers.length} ${limitedMembers.length === 1 ? "Member" : "Members"}`}
      icon={Users}
      initialOpen={initialOpen}
      viewLabel="View team"
      hideLabel="Hide team"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="stack-list stack-list--dense">
        {limitedMembers.map((member, idx) => {
          const name = typeof member === "object" ? member.name : member;
          const role = typeof member === "object" && member.role ? member.role : "Organizer";
          const phone = typeof member === "object" ? member.phone : null;

          return (
            <div key={idx} className="stack-item stack-item--row" title={`${name} • ${role}`}>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-200">{name}</p>
                <p className="mt-0.5 text-[9px] font-medium text-slate-400">{role}</p>
              </div>

              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="action-icon"
                  title={`Call ${name}`}
                >
                  <Phone className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </DetailAccordion>
  );
};

export default OrganizerMembers;