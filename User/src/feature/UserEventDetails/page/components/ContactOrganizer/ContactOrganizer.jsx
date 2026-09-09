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
    <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 shadow-xl backdrop-blur-xl">
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <MessageSquare className="h-4 w-4 text-emerald-400" />

        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Contact & Support
          </h3>
          <span className="text-[9px] uppercase tracking-[0.14em] text-slate-400">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
        >
          <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
          Ask Platform Support
        </button>
      )}

      {/* DYNAMIC NOTE */}
      <p className="pt-1 text-center text-[10px] leading-relaxed text-slate-300">
        {contactSupportNote || defaultNote}
      </p>
    </div>
  );
};

export default ContactOrganizer;
