import React, { useState } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import {
  CalendarDays,
  Plus,
  Trash2,
} from "lucide-react";
import FormSection from "../common/FormSection";
import FormField from "../common/FormField";

const TIMELINE_TYPES = [
  "Registration",
  "Event",
  "Submission",
  "Results / Announcement",
  "Other",
];

export default function EventSchedule() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const schedules =
    useWatch({
      control,
      name: "schedules",
    }) || [];

  const MAX_LIMIT = 10;
  const isMaxReached = fields.length >= MAX_LIMIT;

  return (
    <FormSection
      icon={CalendarDays}
      title="Event Schedule & Timeline"
      description="Add important dates and times for your event."
      onToggle={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      toggleLabel={isOpen ? "Collapse event schedule and timeline" : "Expand event schedule and timeline"}
      action={
        <span className="inline-flex min-w-[4.5rem] justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
          Optional ({fields.length}/{MAX_LIMIT})
        </span>
      }
    >
      {isOpen && (
        <div className="space-y-5 transition-all">
          {fields.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium text-slate-400 sm:hidden">
                Swipe horizontal to navigate schedules →
              </p>

              <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-none sm:block sm:space-y-2 sm:gap-0 sm:overflow-visible sm:pb-0">
                {fields.map((field, index) => {
                  const scheduleError = errors.schedules?.[index];
                  const selectedType = schedules[index]?.type;

                  return (
                    <div
                      key={field.id}
                      className="w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm sm:w-full sm:shrink"
                    >
                      <div className="bg-slate-50/50 p-2.5">
                        <div className="space-y-2">
                          <FormField
                            label="Event Type"
                            htmlFor={`event-create-schedule-${index}-type`}
                            error={scheduleError?.type?.message}
                          >
                            <select
                              id={`event-create-schedule-${index}-type`}
                              {...register(`schedules.${index}.type`, {
                                required: "Event type is required",
                              })}
                              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            >
                              <option value="" className="bg-white text-slate-500">
                                Select Event Type
                              </option>

                              {TIMELINE_TYPES.map((type) => (
                                <option key={type} value={type} className="bg-white text-slate-800">
                                  {type}
                                </option>
                              ))}
                            </select>
                          </FormField>

                          {selectedType === "Other" && (
                            <FormField
                              label="Custom Event Type"
                              htmlFor={`event-create-schedule-${index}-custom-type`}
                              error={scheduleError?.customType?.message}
                              hint="Enter your own schedule type."
                            >
                              <input
                                type="text"
                                id={`event-create-schedule-${index}-custom-type`}
                                placeholder="e.g. Orientation / Workshop / Check-in"
                                {...register(`schedules.${index}.customType`, {
                                  required:
                                    selectedType === "Other"
                                      ? "Please enter the event type"
                                      : false,
                                })}
                                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </FormField>
                          )}

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <FormField
                              label="Date"
                              htmlFor={`event-create-schedule-${index}-date`}
                              error={scheduleError?.date?.message}
                            >
                              <input
                                type="date"
                                id={`event-create-schedule-${index}-date`}
                                {...register(`schedules.${index}.date`, {
                                  required: "Date is required",
                                })}
                                onClick={(e) => {
                                  if (e.currentTarget.showPicker) {
                                    e.currentTarget.showPicker();
                                  }
                                }}
                                className="h-9 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </FormField>

                            <FormField
                              label="Time"
                              htmlFor={`event-create-schedule-${index}-time`}
                              error={scheduleError?.time?.message}
                            >
                              <input
                                type="text"
                                id={`event-create-schedule-${index}-time`}
                                placeholder="09:30 AM"
                                autoComplete="off"
                                {...register(`schedules.${index}.time`, {
                                  required: "Time is required",
                                  pattern: {
                                    value: /^(?:(?:0?[1-9]|1[0-2]):[0-5][0-9](?::[0-5][0-9])?\s?[AaPp][Mm]|(?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?)$/,
                                    message: "Use format like 09:30 AM",
                                  },
                                })}
                                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </FormField>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Remove schedule"
                            aria-label={`Remove schedule ${index + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={isMaxReached}
            onClick={() => {
              append({
                type: "",
                customType: "",
                date: "",
                time: "",
              });
            }}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
              isMaxReached
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>
              {isMaxReached
                ? "Maximum Limit Reached (10/10)"
                : "Add Schedule Item"}
            </span>
          </button>
        </div>
      )}
    </FormSection>
  );
}