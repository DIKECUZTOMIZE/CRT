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
    <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 space-y-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
        <Globe className="h-4 w-4 text-white" /> Social Channels
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
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black p-2.5 text-white/80 hover:border-white/20 hover:text-white"
              >
                <Icon className={`h-4 w-4 ${item.color}`} />
                <span className="truncate">{item.label}: {item.url}</span>
              </a>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/40 p-3 text-white/60">
            No social channels added yet.
          </div>
        )}
      </div>
    </div>
  );
}
