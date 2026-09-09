import React, { useState } from "react";
import {
  Search,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  ChevronRight,
  BookOpen,
  Headphones,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

const PlatformSupport = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState(null);

  // WhatsApp Support Number (Country code ke saath, bina + sign ke)
  const whatsappNumber = "919876543210"; 
  const whatsappMessage = encodeURIComponent("Hello! I need support regarding my account or competition.");

  const handleWhatsAppRedirect = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, "_blank");
  };

  const supportChannels = [
    {
      id: "live-chat-whatsapp",
      title: "Priority Live Chat (WhatsApp)",
      description: "Direct messaging with senior technical support on WhatsApp.",
      responseTime: "< 2 mins response",
      icon: MessageSquare,
      badge: "Fastest",
      actionText: "Chat on WhatsApp",
      highlight: true,
      onClick: handleWhatsAppRedirect,
    },
  ];

  const categories = [
    { id: "all", label: "All" },
    { id: "events", label: "Events" },
    { id: "payments", label: "Payouts" },
    { id: "account", label: "Security" },
  ];

  const faqs = [
    {
      id: 1,
      category: "events",
      question: "How do I set up dynamic registration fields?",
      answer:
        "Navigate to Organizer Dashboard > Event Settings > Custom Forms. From there, drag and drop input fields, file upload constraints, or team setup requirements.",
    },
    {
      id: 2,
      category: "payments",
      question: "When are event registration payouts processed?",
      answer:
        "Automated payouts are processed within 24 hours of event phase completion directly to your linked settlement account.",
    },
    {
      id: 3,
      category: "account",
      question: "How can I add co-organizers to my dashboard?",
      answer:
        "Go to Account Settings > Team Members. Send an email invite and select roles like Admin, Scorekeeper, or Finance Viewer.",
    },
    {
      id: 4,
      category: "events",
      question: "How does live leaderboard updating work?",
      answer:
        "You can use the Live Scoreboard interface inside the Organizer Panel to push instant bracket updates, point updates, and match statuses.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeTab === "all" || faq.category === activeTab;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-10 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10">
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-950 p-5 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute -top-20 -left-20 h-48 w-48 sm:h-72 sm:w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 h-48 w-48 sm:h-72 sm:w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto text-center space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-emerald-400">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Support &
              Concierge Hub
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              How can we{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                help you
              </span>
              ?
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm font-normal leading-relaxed">
              Get fast assistance for event management, payouts, or technical
              setup.
            </p>

            {/* SEARCH BAR */}
            <div className="pt-2">
              <div className="relative flex items-center w-full rounded-xl sm:rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-inner focus-within:border-emerald-500 transition-all">
                <Search className="absolute left-3.5 sm:left-4 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search solutions, payouts, or settings..."
                  className="w-full bg-transparent py-3 pl-10 sm:pl-12 pr-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DIRECT CHANNELS GRID */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />{" "}
              Support Channel
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Connect instantly with our team via WhatsApp
            </p>
          </div>

          <div className="grid gap-3 sm:gap-5 grid-cols-1">
            {supportChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.id}
                  onClick={channel.onClick}
                  className="cursor-pointer group relative rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between active:scale-[0.98] border-emerald-500/40 bg-slate-900/80 hover:border-emerald-400"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                        {channel.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {channel.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
                        {channel.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400">
                      <Clock className="h-3 w-3 text-slate-500" />{" "}
                      {channel.responseTime}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-400">
                      {channel.actionText}{" "}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KNOWLEDGE BASE / FAQs */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />{" "}
                Frequently Asked Questions
              </h2>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === cat.id
                      ? "bg-emerald-500 text-slate-950 font-semibold"
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs sm:text-sm font-medium text-slate-200 hover:text-white"
                    >
                      <span className="flex items-center gap-2 pr-2">
                        <HelpCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        {faq.question}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-90 text-emerald-400" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-0 text-xs sm:text-sm text-slate-400 border-t border-slate-800/60 mt-1 leading-relaxed">
                        <p className="pt-2">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                No articles matching your search query.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER SLA BADGE */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] sm:text-xs text-slate-300">
              Guaranteed SLA: <strong>99.9% Uptime</strong> & Enterprise Grade
              Security
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Systems Operational
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlatformSupport;