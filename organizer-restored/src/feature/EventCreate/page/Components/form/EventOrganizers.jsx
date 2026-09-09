import React, { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Users,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Phone,
  User,
  Briefcase,
} from "lucide-react";
import FormSection from "../common/FormSection";

export default function EventOrganizers() {
  const { register, control } = useFormContext();

  const {
    fields: teamFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({
    control,
    name: "organizerTeam",
  });

  const [isExpanded, setIsExpanded] = useState(true);

  const activeMembersCount = teamFields.length;

  const getSummaryText = () => {
    return `${activeMembersCount} Member${activeMembersCount !== 1 ? "s" : ""} in Organizer Team`;
  };

  return (
    <FormSection
      icon={Users}
      title="Organizer Team"
      description="List key coordinators, hosts, and lead organizers for attendee support."
    >
      <div className="space-y-4">
        {/* Accordion Toggle Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between rounded-lg py-1 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus:outline-none"
          >
            <span className="truncate pr-2">{getSummaryText()}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4 transition-all">
            {/* Action Bar Header */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-slate-700">
                  Team Members List
                </span>
                <p className="text-[10px] text-slate-400">
                  Add team leads and contact info to display on the event page.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  appendMember({
                    name: "",
                    role: "",
                    contact: "",
                  })
                }
                className="flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Empty State */}
            {teamFields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-7 text-center">
                <Users className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">
                  No team members added yet
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Click "Add Member" to list lead organizers and support contacts.
                </p>
              </div>
            ) : (
              /* Horizontal Card Slider Container */
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-emerald-200 md:grid md:grid-cols-2 md:overflow-visible">
                {teamFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="w-[85vw] max-w-[320px] shrink-0 snap-start rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md md:w-auto md:max-w-none"
                  >
                    {/* Card Header */}
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                          <UserCheck className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate text-xs font-semibold text-slate-700">
                          Member #{index + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Remove team member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Member Input Fields */}
                    <div className="space-y-3">
                      {/* 1. Full Name */}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500">
                          Member Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="e.g. Alex Morgan"
                            {...register(`organizerTeam.${index}.name`)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {/* 2. Role / Designation */}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-slate-500">
                          Role / Designation
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="e.g. Lead Coordinator"
                            {...register(`organizerTeam.${index}.role`)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {/* 3. Contact Info (Optional) */}
                        {/* <div>
                          <label className="mb-1 block text-[10px] font-medium text-slate-500">
                            Contact Info (Optional)
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="e.g. +91 98765 43210 / email"
                              {...register(`organizerTeam.${index}.contact`)}
                              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </FormSection>
  );
}