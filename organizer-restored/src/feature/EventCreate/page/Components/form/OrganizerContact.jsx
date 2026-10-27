import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  User,
  Phone,
  MessageSquare,
} from "lucide-react";
import FormSection from "../common/FormSection";

export default function OrganizerContact() {
  const {
    register,
    formState: { errors, submitCount },
  } = useFormContext();

  const [isExpanded, setIsExpanded] = useState(false);
  const nameError = errors?.organizerContact?.name;
  const whatsappError = errors?.organizerContact?.whatsapp;

  useEffect(() => {
    if (nameError || whatsappError) {
      setIsExpanded(true);
    }
  }, [nameError, whatsappError, submitCount]);

  return (
    <FormSection
      icon={Phone}
      title="Organizer Contact Details"
      description="Provide direct contact info so participants can reach out for queries or help."
      onToggle={() => setIsExpanded(!isExpanded)}
      isExpanded={isExpanded}
      toggleLabel={isExpanded ? "Collapse organizer contact details" : "Expand organizer contact details"}
      action={null}
    >
        <div className={isExpanded ? "space-y-4" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 transition-all sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                Contact Person / Lead Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Amit Sharma"
                  {...register("organizerContact.name", {
                    required: "Contact person name is required",
                  })}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {nameError && (
                <p className="text-[10px] text-rose-500">
                  {nameError.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                Official Helpdesk WhatsApp Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  {...register("organizerContact.whatsapp", {
                    required: "Official WhatsApp number is required",
                    pattern: {
                      value: /^\+?[0-9\s().-]{10,20}$/,
                      message: "Enter a valid phone number",
                    },
                  })}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Use the official event helpdesk/contact number, not a personal WhatsApp number.
              </p>
              {whatsappError && (
                <p className="text-[10px] text-rose-500">
                  {whatsappError.message}
                </p>
              )}
            </div>

            {/* Support Email */}
            {/* <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                Support Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="e.g. support@eventname.com"
                  {...register("organizerContact.email", {
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {errors?.organizerContact?.email && (
                <p className="text-[10px] text-rose-500">
                  {errors.organizerContact.email.message}
                </p>
              )}
            </div> */}

            {/* Official WhatsApp Group / Channel Link (Optional) */}
            {/* <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                Official WhatsApp Group Link <span className="text-slate-400">(Optional)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  {...register("organizerContact.whatsappGroup")}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                For participants to join official event updates group.
              </p>
            </div> */}
          </div>
        </div>
    </FormSection>
  );
}