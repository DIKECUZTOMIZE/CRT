import React from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import {
  Info,
  MapPin,
  Globe,
  Users,
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

export default function EventBasicInfo() {
  const {
    register,
    setValue,
    watch,
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
  const isEditing = watch("isEditing");
  const seatAvailability = watch("seatAvailability");
  const descriptionValue = watch("description") || "";
  const bannerPreview = watch("bannerUrl") || "";
  const cardPreview = watch("cardImageUrl") || "";
  const hasAddressValues = Boolean(
    watch("location") || watch("state") || watch("district") || watch("city") || watch("pinCode")
  );
  const isAddressRequired = eventMode !== "Online" && (!isEditing || !hasAddressValues);

  return (
    <FormSection
      icon={Info}
      title="Basic Information"
      description="Enter the essential details of your event."
    >
      <div className="space-y-4 sm:space-y-5">
        {/* ==================== EVENT TITLE ==================== */}
        <FormField label="Event Title" required error={errors.title?.message}>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. National Level Code-A-Thon 2026"
              {...register("title", {
                required: "Event title is required",
                maxLength: {
                  value: 80,
                  message: "Title must not exceed 80 characters",
                },
              })}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-14 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              {titleValue.length}/80
            </span>
          </div>
        </FormField>

        {/* ==================== CATEGORY (TEXT INPUT AS BEFORE) ==================== */}
        <FormField label="Category" required error={errors.category?.message}>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Hackathon, Gaming, Workshop, Cultural"
              {...register("category", {
                required: "Category is required",
              })}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
            />
          </div>
        </FormField>

        {/* ==================== EVENT MODE ==================== */}
        <FormField
          label="Event Mode"
          required
          error={errors.eventMode?.message}
        >
          <div className="relative">
            <select
              {...register("eventMode", {
                required: "Please select event mode",
              })}
              className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-8 text-xs font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
            >
              <option value="">Select Event Mode</option>
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </FormField>

        <FormField label="Event Status" required error={errors.status?.message}>
          <div className="relative">
            <select
              {...register("status", {
                required: "Please select event status",
              })}
              defaultValue="upcoming"
              className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-8 text-xs font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
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

        {/* ==================== DATE & TIME ==================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <FormField
              label="Event Start Date"
              required
              error={errors.eventDate?.message}
            >
              <div className="relative">
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  {...register("eventDate", {
                    required: "Event start date is required",
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>

            <FormField
              label="Event Start Time"
              required
              error={errors.eventStartTime?.message}
            >
              <div className="relative">
                <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="09:30 AM"
                  autoComplete="off"
                  {...register("eventStartTime", {
                    required: "Event start time is required",
                    pattern: {
                      value: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
                      message: "Use format like 09:30 AM",
                    },
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 pr-10 text-xs text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>
          </div>

          <div className="space-y-4">
            <FormField
              label="Event End Date"
              required
              error={errors.eventEndDate?.message}
            >
              <div className="relative">
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  {...register("eventEndDate", {
                    required: "Event end date is required",
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>

            <FormField
              label="Event End Time"
              required
              error={errors.eventEndTime?.message}
            >
              <div className="relative">
                <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="05:30 PM"
                  autoComplete="off"
                  {...register("eventEndTime", {
                    required: "Event end time is required",
                    pattern: {
                      value: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
                      message: "Use format like 05:30 PM",
                    },
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 pr-10 text-xs text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
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
                  placeholder="e.g. Main Auditorium, Campus A, Guwahati, Assam"
                  {...register("location", {
                    required:
                      eventMode === "Offline"
                        ? "Full venue address is required for offline events"
                        : false,
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </div>
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="State" required={isAddressRequired} error={errors.state?.message}>
                <input
                  type="text"
                  placeholder="e.g. Assam"
                  {...register("state", {
                    required: isAddressRequired ? "State is required" : false,
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </FormField>

              <FormField label="District" required={isAddressRequired} error={errors.district?.message}>
                <input
                  type="text"
                  placeholder="e.g. Kamrup"
                  {...register("district", {
                    required: isAddressRequired ? "District is required" : false,
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </FormField>

              <FormField label="City" required={isAddressRequired} error={errors.city?.message}>
                <input
                  type="text"
                  placeholder="e.g. Guwahati"
                  {...register("city", {
                    required: isAddressRequired ? "City is required" : false,
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </FormField>

              <FormField label="Pin Code" required={isAddressRequired} error={errors.pinCode?.message}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 781001"
                  {...register("pinCode", {
                    required: isAddressRequired ? "Pin code is required" : false,
                  })}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                />
              </FormField>
            </div>
          </div>
        )}

        {/* ==================== ONLINE PLATFORM LINK ==================== */}
        {(eventMode === "Online" || eventMode === "Hybrid") && (
          <FormField
            label="Online Platform / Meeting Link"
            hint="Optional (Can be added or updated later)"
            error={errors.onlineLink?.message}
          >
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                {...register("onlineLink")}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
              />
            </div>
          </FormField>
        )}

        {/* ==================== SEAT AVAILABILITY (CUSTOM LOGIC APPLIED HERE) ==================== */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Seat Availability"
              required
              error={errors.seatAvailability?.message}
            >
              <div className="relative">
                <select
                  {...register("seatAvailability", {
                    required: "Please select seat availability",
                  })}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 pr-8 text-xs font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                >
                  <option value="">Select Availability</option>
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                  <option value="Other">Other / Custom</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </FormField>

            {/* Rendered ONLY when "Available" is selected */}
            {seatAvailability === "Available" && (
              <FormField
                label="Total Seats"
                required
                error={errors.totalSeats?.message}
              >
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    {...register("totalSeats", {
                      required:
                        seatAvailability === "Available"
                          ? "Total seats is required"
                          : false,
                      valueAsNumber: true,
                      min: {
                        value: 1,
                        message: "Seats must be at least 1",
                      },
                    })}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                  />
                </div>
              </FormField>
            )}
          </div>

          {/* Custom Seat Input: Rendered ONLY when seatAvailability === "Other" */}
          {seatAvailability === "Other" && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <FormField
                label="Custom Seat Details"
                required
                error={errors.customSeatDetails?.message}
                hint="Provide custom invitation terms or seat limitations."
              >
                <div className="relative">
                  <Edit3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="e.g. Invitation Only / Max 25 teams via qualifying round"
                    {...register("customSeatDetails", {
                      required:
                        seatAvailability === "Other"
                          ? "Custom seat detail is required"
                          : false,
                    })}
                    className="h-10 w-full rounded-xl border border-emerald-300 bg-emerald-50/30 pl-9 pr-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                  />
                </div>
              </FormField>
            </div>
          )}
        </div>

        {/* ==================== IMAGE SECTION ==================== */}
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <div className="mb-3 flex items-center gap-2">
            <Image className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white">Event Images</h3>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
              Optional
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Banner Image"
              hint="Upload a large cover image for the event header"
              error={errors.bannerUrl?.message}
            >
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload("bannerUrl", e)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 py-2 text-[11px] text-white file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-white"
                  />
                </div>

                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="h-28 w-full rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#111111] text-[11px] text-slate-400">
                    No banner uploaded yet
                  </div>
                )}
              </div>
            </FormField>

            <FormField
              label="Card Image"
              hint="Upload a thumbnail image for event cards"
              error={errors.cardImageUrl?.message}
            >
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload("cardImageUrl", e)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-3 py-2 text-[11px] text-white file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-white"
                  />
                </div>

                {cardPreview ? (
                  <img
                    src={cardPreview}
                    alt="Card preview"
                    className="h-28 w-full rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#111111] text-[11px] text-slate-400">
                    No card image uploaded yet
                  </div>
                )}
              </div>
            </FormField>
          </div>
        </div>

        {/* ==================== DESCRIPTION ==================== */}
        <FormField
          label="Description"
          error={errors.description?.message}
          hint="Optional. Add event details, requirements, or other useful information."
        >
          <div className="relative">
            <textarea
              rows={4}
              placeholder="Tell participants about your event..."
              {...register("description", {
                maxLength: {
                  value: 2000,
                  message: "Description limit is 2000 characters",
                },
              })}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
            />
            <span className="absolute bottom-3 right-3 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              {descriptionValue.length}/2000
            </span>
          </div>
        </FormField>
      </div>
    </FormSection>
  );
}
