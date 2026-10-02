import React from "react";
import { MessageSquare, PhoneCall, HelpCircle } from "lucide-react";

export const ContactOrganizer = ({
  whatsappNumber,
  onPlatformSupport,
  contactSupportNote,
}) => {
  const cleanNumber = whatsappNumber?.replace(/[^0-9]/g, "") || "";

  const defaultNote =
    "For event participation, registration, or event-related questions, contact the organizer directly. For website or platform-related issues, ask Platform Support.";

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_10px_26px_rgba(15,118,110,0.05)] backdrop-blur-xl">
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
        <MessageSquare className="h-4 w-4 text-emerald-600" />

        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Contact & Support
          </h3>
          <span className="text-[9px] uppercase tracking-[0.14em] text-slate-600">
            Ask before you register
          </span>
        </div>
      </div>

      {/* ORGANIZER WHATSAPP */}
      {cleanNumber && (
        <a
          href={`https://wa.me/${cleanNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-[#ECFDF5] py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-[#D1FAE5]"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Contact Organizer on WhatsApp
        </a>
      )}

      {/* PLATFORM SUPPORT */}
      {onPlatformSupport && (
        <button
          type="button"
          onClick={onPlatformSupport}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-[#F8FBF9] py-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-slate-900"
        >
          <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
          Ask Platform Support
        </button>
      )}

      {/* DYNAMIC NOTE */}
      <p className="pt-1 text-center text-[10px] leading-relaxed text-slate-600">
        {contactSupportNote || defaultNote}
      </p>
    </div>
  );
};

export default ContactOrganizer;
