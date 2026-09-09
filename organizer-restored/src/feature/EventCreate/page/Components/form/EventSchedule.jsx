import React, { useState } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import {
  CalendarDays,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
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
  const [openItems, setOpenItems] = useState({});

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

  const toggleItem = (fieldId) => {
    setOpenItems((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const handleRemove = (index, fieldId) => {
    remove(index);

    setOpenItems((prev) => {
      const updated = { ...prev };
      delete updated[fieldId];
      return updated;
    });
  };

  return (
    <FormSection
      icon={CalendarDays}
      title="Event Schedule & Timeline"
      description="Add important dates and times for your event."
    >
      <div className="rounded-xl border border-white/10 bg-[#111111] p-2 transition-all">
        {/* ==================== MAIN ACCORDION HEADER ==================== */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full select-none items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
        >
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-white sm:text-sm">
              Event Schedule
            </h4>

            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200">
              Optional ({fields.length}/{MAX_LIMIT})
            </span>
          </div>

          <div className="p-0.5 text-slate-300">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {/* ==================== MAIN ACCORDION BODY ==================== */}
        {isOpen && (
          <div className="mt-2 space-y-2.5 border-t border-white/10 pt-2.5">
            {/* ==================== EMPTY STATE ==================== */}
            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-[#0d0d0d] p-3 text-center">
                <p className="text-xs text-slate-400">
                  No schedule added yet. Click below to add a date and time.
                </p>
              </div>
            ) : (
              /* ==================== MOBILE SLIDER / DESKTOP STACK ==================== */
              <div>
                <p className="mb-1.5 text-[10px] font-medium text-slate-400 sm:hidden">
                  Swipe horizontal to navigate schedules →
                </p>

                <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-none sm:block sm:space-y-2 sm:gap-0 sm:overflow-visible sm:pb-0">
                  {fields.map((field, index) => {
                    const scheduleError = errors.schedules?.[index];
                    const itemOpen = !!openItems[field.id];
                    const selectedType = schedules[index]?.type;

                    return (
                      <div
                        key={field.id}
                        className="w-[88%] shrink-0 snap-center overflow-hidden rounded-lg border border-white/10 bg-[#121212] shadow-sm transition-all hover:border-emerald-500/40 sm:w-full sm:shrink"
                      >
                        {/* ==================== ITEM HEADER ==================== */}
                        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                          <button
                            type="button"
                            onClick={() => toggleItem(field.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-300">
                              {index + 1}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-white">
                                Schedule Item #{index + 1}
                              </p>

                              <p className="text-[10px] text-slate-400">
                                {itemOpen
                                  ? "Tap to close"
                                  : "Tap to add schedule details"}
                              </p>
                            </div>

                            <span className="ml-auto shrink-0 text-slate-300">
                              {itemOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          </button>

                          {/* REMOVE */}
                          <button
                            type="button"
                            onClick={() => handleRemove(index, field.id)}
                            className="shrink-0 rounded-md p-1.5 text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                            title="Remove schedule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* ==================== ITEM BODY ==================== */}
                        {itemOpen && (
                          <div className="border-t border-white/10 bg-[#0d0d0d] p-2.5">
                            <div className="space-y-2">
                              {/* ==================== EVENT TYPE ==================== */}
                              <FormField
                                label="Event Type"
                                error={scheduleError?.type?.message}
                              >
                                <select
                                  {...register(`schedules.${index}.type`, {
                                    required: "Event type is required",
                                  })}
                                  className="h-9 w-full rounded-md border border-white/10 bg-[#0f0f0f] px-2.5 text-xs text-white outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                >
                                  <option value="" className="bg-[#0f0f0f] text-slate-300">
                                    Select Event Type
                                  </option>

                                  {TIMELINE_TYPES.map((type) => (
                                    <option key={type} value={type} className="bg-[#0f0f0f] text-white">
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              </FormField>

                              {/* ==================== OTHER TYPE ==================== */}
                              {selectedType === "Other" && (
                                <FormField
                                  label="Custom Event Type"
                                  error={scheduleError?.customType?.message}
                                  hint="Enter your own schedule type."
                                >
                                  <input
                                    type="text"
                                    placeholder="e.g. Orientation / Workshop / Check-in"
                                    {...register(
                                      `schedules.${index}.customType`,
                                      {
                                        required:
                                          selectedType === "Other"
                                            ? "Please enter the event type"
                                            : false,
                                      }
                                    )}
                                    className="h-9 w-full rounded-md border border-white/10 bg-[#0f0f0f] px-2.5 text-xs text-white placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                  />
                                </FormField>
                              )}

                              {/* ==================== DATE & TIME ==================== */}
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {/* DATE */}
                                <FormField
                                  label="Date"
                                  error={scheduleError?.date?.message}
                                >
                                  <input
                                    type="date"
                                    {...register(`schedules.${index}.date`, {
                                      required: "Date is required",
                                    })}
                                    onClick={(e) => {
                                      if (e.currentTarget.showPicker) {
                                        e.currentTarget.showPicker();
                                      }
                                    }}
                                    className="h-9 w-full cursor-pointer rounded-md border border-white/10 bg-[#0f0f0f] px-2.5 text-xs text-white outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                  />
                                </FormField>

                                {/* TIME */}
                                <FormField
                                  label="Time"
                                  error={scheduleError?.time?.message}
                                >
                                  <input
                                    type="text"
                                    placeholder="09:30 AM"
                                    autoComplete="off"
                                    {...register(`schedules.${index}.time`, {
                                      required: "Time is required",
                                      pattern: {
                                        value: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
                                        message: "Use format like 09:30 AM",
                                      },
                                    })}
                                    className="h-9 w-full cursor-text rounded-md border border-white/10 bg-[#0f0f0f] px-2.5 text-xs text-white placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                  />
                                </FormField>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==================== ADD BUTTON ==================== */}
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
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all ${
                isMaxReached
                  ? "cursor-not-allowed border-white/10 bg-[#1a1a1a] text-slate-500"
                  : "border-dashed border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
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
      </div>
    </FormSection>
  );
}