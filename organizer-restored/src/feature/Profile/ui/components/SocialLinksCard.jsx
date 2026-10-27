import React from "react";
import { Globe } from "lucide-react";
import { FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";
export default function SocialLinksCard({ socials }) {
  const links = [
    {
      icon: FaInstagram,
      url: socials?.instagram?.trim(),
      color: "text-pink-500",
      label: "Instagram",
    },
    {
      icon: FaTwitter,
      url: socials?.twitter?.trim(),
      color: "text-sky-400",
      label: "Twitter",
    },
    {
      icon: FaLinkedin,
      url: socials?.linkedin?.trim(),
      color: "text-blue-500",
      label: "LinkedIn",
    },
  ].filter((item) => item.url);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-5 space-y-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#E2E8F0]">
        <Globe className="h-4 w-4 text-[#34D399]" /> Social Channels
      </h3>

      <div className="space-y-2 text-xs">
        {links.length > 0 ? (
          links.map((item, idx) => {
            const Icon = item.icon;
            return (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-[#CBD5E1] hover:border-[#10B981]/40 hover:text-[#E2E8F0]"
              >
                <Icon className={`h-4 w-4 ${item.color}`} />
                <span className="truncate">{item.label}: {item.url}</span>
              </a>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-3 text-[#94A3B8]">
            No social channels added yet.
          </div>
        )}
      </div>
    </div>
  );
}
