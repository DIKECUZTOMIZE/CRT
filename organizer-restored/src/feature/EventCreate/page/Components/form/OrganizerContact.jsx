import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  User,
  Phone,
  Mail,
  MessageSquare,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import FormSection from "../common/FormSection";

export default function OrganizerContact() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <FormSection
      icon={Phone}
      title="Organizer Contact Details"
      description="Provide direct contact info so participants can reach out for queries or help."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between rounded-lg py-1 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus:outline-none"
          >
            <span className="truncate pr-2">
              Organizer & Helpdesk Info
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 gap-4 transition-all sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                Contact Person / Lead Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma (Lead Organizer)"
                  {...register("organizerContact.name", {
                    required: "Contact person name is required",
                  })}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {errors?.organizerContact?.name && (
                <p className="text-[10px] text-rose-500">
                  {errors.organizerContact.name.message}
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
                  placeholder="e.g. +91 9876543210"
                  {...register("organizerContact.whatsapp", {
                    required: "Official WhatsApp number is required",
                    pattern: {
                      value: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                      message: "Enter a valid phone number",
                    },
                  })}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Use the official event helpdesk/contact number, not a personal WhatsApp number.
              </p>
              {errors?.organizerContact?.whatsapp && (
                <p className="text-[10px] text-rose-500">
                  {errors.organizerContact.whatsapp.message}
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
        )}
      </div>
    </FormSection>
  );
}