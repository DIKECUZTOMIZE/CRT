import React from "react";
import { Users } from "lucide-react";
import DetailAccordion from "../../../../../shared/components/ui/DetailAccordion";

export const OrganizerMembers = ({ members = [], initialOpen = false, open = false, onToggle }) => {
  if (!Array.isArray(members) || members.length === 0) return null;

  return (
    <DetailAccordion
      title="Organizer Team"
      badge={`${members.length} ${members.length === 1 ? "Member" : "Members"}`}
      icon={Users}
      initialOpen={initialOpen}
      open={open}
      onToggle={onToggle}
      viewLabel="View team"
      hideLabel="Hide team"
      iconClassName="panel-icon--emerald"
      bodyClassName="panel-body--stacked"
    >
      <div className="stack-list stack-list--dense">
        {members.map((member, idx) => {
          const name = typeof member === "object" ? member.name : member;
          const role = typeof member === "object" ? member.role : "";
          const contact = typeof member === "object" ? member.contact : "";
          const title = [name, role, contact].filter(Boolean).join(" • ");

          if (!title) return null;

          return (
            <div key={idx} className="stack-item stack-item--row stack-item--light" title={title}>
              <div className="min-w-0">
                {name && <p className="truncate text-xs font-bold text-slate-900">{name}</p>}
                {role && <p className="mt-0.5 text-[9px] font-medium text-slate-500">{role}</p>}
                {contact && <p className="mt-0.5 break-all text-[9px] font-medium text-slate-600">Contact: {contact}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </DetailAccordion>
  );
};

export default OrganizerMembers;