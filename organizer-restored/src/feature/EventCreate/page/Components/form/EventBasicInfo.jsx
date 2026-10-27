import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import {
  Info,
  MapPin,
  Globe,
  Tag,
  Calendar,
  Clock,
  Edit3,
  ChevronDown,
  Image,
} from "lucide-react";
import FormSection from "../common/FormSection";
import FormField from "../common/FormField";
import { uploadEventImage } from "../../../api/events.api.js";
import { isEndTimeOnOrAfterStartTime, isStartNotInPastIst } from "../../../utils/eventDateTimeValidation.js";

export default function EventBasicInfo() {
  const {
    register,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext();

  const handleImageUpload = async (fieldName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await uploadEventImage(file);
      setValue(fieldName, uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(error.message || "Image upload failed");
    }
  };

  // Dynamic values watching
  const titleValue = watch("title") || "";
  const eventMode = watch("eventMode");
  const eventDate = watch("eventDate") || "";
  const eventEndDate = watch("eventEndDate") || "";
  const eventStartTime = watch("eventStartTime") || "";
  const isEditing = watch("isEditing");
  const seatAvailability = watch("seatAvailability");
  const descriptionValue = watch("description") || "";
  const bannerPreview = watch("bannerUrl") || "";
  const hasAddressValues = Boolean(
    watch("location") || watch("state") || watch("district") || watch("city") || watch("pinCode")
  );
  const isAddressRequired = eventMode !== "Online" && (!isEditing || !hasAddressValues);

  useEffect(() => {
    if (eventDate && (eventEndDate || getValues("eventEndTime"))) {
      void trigger(["eventEndDate", "eventEndTime"]);
    }
    if (!isEditing && eventDate && eventStartTime) {
      void trigger("eventStartTime");
    }
  }, [eventDate, eventEndDate, eventStartTime, isEditing, getValues, trigger]);

  return (
    <>
      <style>{`
        .create-event-form .event-create-basic-info-shell input,
        .create-event-form .event-create-basic-info-shell select,
        .create-event-form .event-create-basic-info-shell textarea {
          background-color: rgba(15, 23, 42, 0.7) !important;
          border-color: #334155 !important;
          color: #CBD5E1 !important;
          -webkit-text-fill-color: #CBD5E1 !important;
          background-image: none !important;
          box-shadow: none !important;
        }

        .create-event-form #event-create-title::placeholder,
        .create-event-form #event-create-title::-webkit-input-placeholder {
          color: #333333 !important;
          -webkit-text-fill-color: #333333 !important;
          opacity: 1 !important;
        }

        .create-event-form .event-create-image-panel {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: #1E293B !important;
        }

        .create-event-form .event-create-image-panel h3,
        .create-event-form .event-create-image-panel .form-field-label,
        .create-event-form .banner-image-field .form-field-label {
          color: #E2E8F0 !important;
        }

        .create-event-form .event-create-image-panel .form-field-hint,
        .create-event-form .banner-image-field .form-field-hint {
          color: #94A3B8 !important;
        }

        .create-event-form .banner-upload-input {
          background: rgba(15, 23, 42, 0.7) !important;
          border-color: #334155 !important;
          color: #CBD5E1 !important;
          -webkit-text-fill-color: #CBD5E1 !important;
        }

        .create-event-form .banner-upload-input::placeholder {
          color: #333333 !important;
          opacity: 1 !important;
        }

        .create-event-form .banner-preview-box {
          background: rgba(15, 23, 42, 0.7) !important;
          border-color: #1E293B !important;
          color: #94A3B8 !important;
        }

        .create-event-form .event-create-basic-info-shell .form-section-title,
        .create-event-form .event-create-basic-info-shell .form-section-description {
          line-height: 1.4 !important;
          white-space: normal !important;
        }

        .create-event-form .event-create-basic-info-shell .form-section-title {
          color: #E2E8F0 !important;
        }

        .create-event-form .event-create-basic-info-shell .form-section-description {
          color: #94A3B8 !important;
        }

        .create-event-form .banner-upload-shell {
          gap: 0.5rem !important;
        }

        .create-event-form .banner-upload-input {
          min-height: 2.25rem !important;
          padding-top: 0.35rem !important;
          padding-bottom: 0.35rem !important;
        }

        .create-event-form .banner-preview-box {
          height: 5.25rem !important;
        }

        @media (max-width: 639.98px) {
          .event-create-basic-info-shell {
            background: #0f172a !important;
            border-color: #334155 !important;
            color: #E2E8F0 !important;
          }
          .event-create-basic-info-shell .form-section-header {
            background: #0f172a !important;
            border-color: #334155 !important;
          }
        }
      `}</style>
      <FormSection
        icon={Info}
        title="Basic Information"
        description="Enter the essential details of your event."
        className="event-create-basic-info-shell border-[#334155] bg-[#0f172a] text-[#E2E8F0] shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:border-white/10 sm:bg-[#0b0b0b] sm:text-[#E2E8F0]"
      >
      <div className="space-y-3 sm:space-y-4">
        {/* ==================== EVENT TITLE ==================== */}
        <FormField label="Event Title" htmlFor="event-create-title" required error={errors.title?.message}>
          <div className="relative">
            <input
              type="text"
              id="event-create-title"
              placeholder="Name your event"
              {...register("title", {
                required: "Event title is required",
                maxLength: {
                  value: 80,
                  message: "Title must not exceed 80 characters",
                },
              })}
              className="event-create-basic-info-title-input h-10 w-full rounded-xl border border-[#334155] bg-[rgba(2,6,23,0.7)] px-3.5 pr-14 text-xs text-[#CBD5E1] placeholder:text-[#4B5563] outline-none transition-all focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 sm:text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
              {titleValue.length}/80
            </span>
          </div>
        </FormField>

        {/* ==================== CATEGORY (TEXT INPUT AS BEFORE) ==================== */}
        <FormField label="Category" htmlFor="event-create-category" required error={errors.category?.message}>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="event-create-category"
              placeholder="Add event category"
              {...register("category", {
                required: "Category is required",
              })}
              className="h-10 w-full rounded-xl border border-[#334155] bg-[rgba(15,23,42,0.7)] pl-9 pr-3.5 text-xs text-[#CBD5E1] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 sm:text-sm"
            />
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* ==================== EVENT MODE ==================== */}
          <FormField
            label="Event Mode"
            htmlFor="event-create-mode"
            required
            error={errors.eventMode?.message}
          >
            <div className="relative">
              <select
                id="event-create-mode"
                {...register("eventMode", {
                  required: "Please select event mode",
                })}
                className="h-10 w-full appearance-none rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 pr-8 text-xs font-medium text-[#334155] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
              >
                <option value="">Select Event Mode</option>
                <option value="Offline">Offline</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </FormField>

          <FormField label="Event Status" htmlFor="event-create-status" required error={errors.status?.message}>
            <div className="relative">
              <select
                id="event-create-status"
                {...register("status", {
                  required: "Please select event status",
                })}
                defaultValue="upcoming"
                className="h-10 w-full appearance-none rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 pr-8 text-xs font-medium text-[#334155] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
                <option value="postponed">Postponed</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </FormField>
        </div>

        {/* ==================== DATE & TIME ==================== */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-3 sm:space-y-4">
            <FormField
              label="Event Start Date"
              htmlFor="event-create-start-date"
              required
              error={errors.eventDate?.message}
            >
              <div className="relative">
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  id="event-create-start-date"
                  {...register("eventDate", {
                    required: "Event start date is required",
                    validate: (value) =>
                      isEditing ||
                      isStartNotInPastIst({ startDate: value, startTime: "" }) ||
                      "Event start date cannot be in the past",
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs text-[#334155] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>

            <FormField
              label="Event Start Time"
              htmlFor="event-create-start-time"
              required
              error={errors.eventStartTime?.message}
            >
              <div className="relative">
                <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="event-create-start-time"
                  placeholder="Start time"
                  autoComplete="off"
                  {...register("eventStartTime", {
                    required: "Event start time is required",
                    validate: (value) =>
                      isEditing ||
                      isStartNotInPastIst({ startDate: eventDate, startTime: value }) ||
                      "Event start date and time cannot be in the past",
                    pattern: {
                      value: /^(?:(?:0?[1-9]|1[0-2]):[0-5][0-9](?::[0-5][0-9])?\s?[AaPp][Mm]|(?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?)$/,
                      message: "Use format like 09:30 AM",
                    },
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 pr-10 text-xs text-[#334155] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <FormField
              label="Event End Date"
              htmlFor="event-create-end-date"
              required
              error={errors.eventEndDate?.message}
            >
              <div className="relative">
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  id="event-create-end-date"
                  min={eventDate || undefined}
                  {...register("eventEndDate", {
                    required: "Event end date is required",
                    validate: (value) =>
                      !value ||
                      !eventDate ||
                      value >= eventDate ||
                      "Event end date must be on or after the start date",
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 text-xs text-[#334155] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>

            <FormField
              label="Event End Time"
              htmlFor="event-create-end-time"
              required
              error={errors.eventEndTime?.message}
            >
              <div className="relative">
                <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="event-create-end-time"
                  placeholder="End time"
                  autoComplete="off"
                  {...register("eventEndTime", {
                    required: "Event end time is required",
                    validate: (value) =>
                      isEndTimeOnOrAfterStartTime({
                        startDate: eventDate,
                        endDate: eventEndDate,
                        startTime: eventStartTime,
                        endTime: value,
                      }) ||
                      "Event end time must be on or after the start time on the same date",
                    pattern: {
                      value: /^(?:(?:0?[1-9]|1[0-2]):[0-5][0-9](?::[0-5][0-9])?\s?[AaPp][Mm]|(?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?)$/,
                      message: "Use format like 05:30 PM",
                    },
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 pr-10 text-xs text-[#334155] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>
          </div>
        </div>

        {/* ==================== LOCATION ==================== */}
        {(eventMode === "Offline" ||
          eventMode === "Online" ||
          eventMode === "Hybrid") && (
          <div className="space-y-4">
            <FormField
              label="Full Address"
              htmlFor="event-create-location"
              required={eventMode === "Offline"}
              hint={
                eventMode === "Online"
                  ? "Optional for online events"
                  : "Enter the full venue address so users can understand the exact location."
              }
              error={errors.location?.message}
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="event-create-location"
                  placeholder="Venue name and address"
                  {...register("location", {
                    required:
                      eventMode === "Offline"
                        ? "Full venue address is required for offline events"
                        : false,
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] pl-9 pr-3.5 text-xs text-[#334155] placeholder-[#94A3B8] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <FormField label="State" htmlFor="event-create-state" required={isAddressRequired} error={errors.state?.message}>
                <input
                  type="text"
                  id="event-create-state"
                  placeholder="State"
                  {...register("state", {
                    required: isAddressRequired ? "State is required" : false,
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-xs text-[#334155] placeholder-[#94A3B8] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </FormField>

              <FormField label="District" htmlFor="event-create-district" required={isAddressRequired} error={errors.district?.message}>
                <input
                  type="text"
                  id="event-create-district"
                  placeholder="District"
                  {...register("district", {
                    required: isAddressRequired ? "District is required" : false,
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-xs text-[#334155] placeholder-[#94A3B8] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </FormField>

              <FormField label="City" htmlFor="event-create-city" required={isAddressRequired} error={errors.city?.message}>
                <input
                  type="text"
                  id="event-create-city"
                  placeholder="City"
                  {...register("city", {
                    required: isAddressRequired ? "City is required" : false,
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-xs text-[#334155] placeholder-[#94A3B8] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </FormField>

              <FormField label="Pin Code" htmlFor="event-create-pin-code" required={isAddressRequired} error={errors.pinCode?.message}>
                <input
                  type="text"
                  id="event-create-pin-code"
                  inputMode="numeric"
                  placeholder="6-digit pin code"
                  {...register("pinCode", {
                    required: isAddressRequired ? "Pin code is required" : false,
                  })}
                  className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-xs text-[#334155] placeholder-[#94A3B8] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ==================== ONLINE PLATFORM LINK ==================== */}
        {(eventMode === "Online" || eventMode === "Hybrid") && (
          <FormField
            label="Online Platform / Meeting Link"
            htmlFor="event-create-online-link"
            hint="Optional (Can be added or updated later)"
            error={errors.onlineLink?.message}
          >
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                id="event-create-online-link"
                placeholder="Meeting link or platform URL"
                {...register("onlineLink")}
                className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] pl-9 pr-3.5 text-xs text-[#334155] placeholder-[#94A3B8] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
              />
            </div>
          </FormField>
        )}

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[1.2fr_0.8fr] md:gap-4">
          <div className="event-create-image-panel rounded-2xl border border-[#334155] bg-[rgba(15,23,42,0.75)] p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:border-[#334155] sm:bg-[rgba(15,23,42,0.75)] sm:p-3 sm:shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
            <div className="mb-2 flex items-center gap-2">
              <Image className="h-4 w-4 text-[#10B981] sm:text-[#10B981]" />
              <h3 className="text-xs font-semibold text-[#E2E8F0] sm:text-[#E2E8F0]" style={{ color: '#E2E8F0' }}>Event Images</h3>
              <span className="rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-medium text-[#059669] sm:border-emerald-500/30 sm:bg-emerald-500/10 sm:text-emerald-200">
                Optional
              </span>
            </div>

            <FormField
              label="Banner Image"
              htmlFor="event-create-banner-image"
              hint="Upload a large cover image for the event header"
              error={errors.bannerUrl?.message}
              className="banner-image-field"
            >
              <div className="banner-upload-shell space-y-2">
                <div className="relative">
                  <input
                    type="file"
                    id="event-create-banner-image"
                    accept="image/*"
                    onChange={(e) => handleImageUpload("bannerUrl", e)}
                    className="banner-upload-input h-9 w-full rounded-xl border border-[#334155] bg-[rgba(2,6,23,0.7)] px-3 py-2 text-[11px] text-[#CBD5E1] file:mr-3 file:rounded-md file:border-0 file:bg-[#10B981] file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-slate-950 sm:border-[#334155] sm:bg-[rgba(2,6,23,0.7)] sm:text-[#CBD5E1]"
                  />
                </div>

                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="banner-preview-box h-20 w-full rounded-xl border border-[#D1FAE5] object-cover sm:h-24 sm:border-white/10"
                  />
                ) : (
                  <div className="banner-preview-box flex h-20 items-center justify-center rounded-xl border border-dashed border-[#334155] bg-[rgba(2,6,23,0.7)] text-[11px] text-[#94A3B8] sm:h-24 sm:border-[#334155] sm:bg-[rgba(2,6,23,0.7)] sm:text-[#94A3B8]" style={{ color: '#94A3B8' }}>
                    No banner uploaded yet
                  </div>
                )}
              </div>
            </FormField>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FormField
                label="Seat Availability"
                htmlFor="event-create-seat-availability"
                required
                error={errors.seatAvailability?.message}
              >
                <div className="relative">
                  <select
                    id="event-create-seat-availability"
                    {...register("seatAvailability", {
                      required: "Please select seat availability",
                      validate: (value) =>
                        ["Available", "Not Available", "Other"].includes(value) ||
                        "Please select a valid seat availability option",
                    })}
                    className="h-10 w-full appearance-none rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 pr-8 text-xs font-medium text-[#334155] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                  >
                    <option value="">Select Availability</option>
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available</option>
                    <option value="Other">Custom</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </FormField>
            </div>

            {seatAvailability === "Other" && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <FormField
                  label="Custom Availability Details"
                  htmlFor="event-create-custom-seat-details"
                  required
                  error={errors.customSeatDetails?.message}
                  hint="Describe the custom availability terms."
                >
                  <div className="relative">
                    <Edit3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                    <input
                      type="text"
                      id="event-create-custom-seat-details"
                      maxLength={500}
                      placeholder="Enter custom availability details"
                      {...register("customSeatDetails", {
                        required:
                          seatAvailability === "Other"
                            ? "Custom availability details are required"
                            : false,
                        validate: (value) =>
                          seatAvailability !== "Other" ||
                          (typeof value === "string" && value.trim().length > 0) ||
                          "Custom availability details are required",
                        maxLength: {
                          value: 500,
                          message: "Custom availability details must not exceed 500 characters",
                        },
                      })}
                      className="h-10 w-full rounded-xl border border-emerald-500/60 bg-[#F8FAFC] pl-9 pr-3.5 text-xs text-[#334155] placeholder-[#94A3B8] outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                    />
                  </div>
                </FormField>
              </div>
            )}
          </div>
        </div>

        {/* ==================== DESCRIPTION ==================== */}
        <FormField
          label="Description"
          htmlFor="event-create-description"
          error={errors.description?.message}
          hint="Optional. Add event details, requirements, or other useful information."
        >
          <div className="relative">
            <textarea
              id="event-create-description"
              rows={4}
              placeholder="Tell participants about your event..."
              {...register("description", {
                maxLength: {
                  value: 2000,
                  message: "Description limit is 2000 characters",
                },
              })}
              className="event-create-basic-info-description w-full resize-y rounded-xl border border-[#334155] bg-[rgba(2,6,23,0.7)] p-3 text-xs text-[#CBD5E1] placeholder:text-[#94A3B8] outline-none transition-all focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 sm:text-sm"
            />
            <span className="absolute bottom-3 right-3 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
              {descriptionValue.length}/2000
            </span>
          </div>
        </FormField>
      </div>
      </FormSection>
    </>
  );
}
