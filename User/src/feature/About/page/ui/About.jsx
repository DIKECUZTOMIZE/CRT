import React, { useState } from "react";
import {
  Trophy,
  Users,
  ShieldCheck,
  Zap,
  Globe2,
  Sparkles,
  ArrowRight,
  Target,
  Award,
  ChevronDown,
  CheckCircle2,
  Building2,
  Mail,
  MessageSquare,
  Activity,
} from "lucide-react";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("participants"); // "participants" | "organizers"
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const metrics = [
    { label: "Total Participants", value: "120,000+", change: "+24% this month", icon: Users, color: "text-emerald-400" },
    { label: "Competitions Hosted", value: "3,450+", change: "100% Verified", icon: Trophy, color: "text-sky-400" },
    { label: "Active Organizers", value: "850+", change: "Across 45 Cities", icon: Building2, color: "text-purple-400" },
    { label: "Platform Uptime", value: "99.99%", change: "SLA Guaranteed", icon: Activity, color: "text-amber-400" },
  ];

  const participantFeatures = [
    { title: "One-Click Registration", desc: "Instantly sign up for hackathons, esports, and developer summits with saved profiles." },
    { title: "Real-time Bracket & Timelines", desc: "Live score updates, automated match schedules, and transparent leaderboard tracking." },
    { title: "Verified Credentials", desc: "Earn verified digital participation certificates backed by ONPE security." },
  ];

  const organizerFeatures = [
    { title: "Automated Participant Management", desc: "Effortlessly handle thousands of team registrations, payments, and team approvals." },
    { title: "Custom Dashboard Analytics", desc: "Gain deep insights into attendee demographics, ticket sales, and engagement metrics." },
    { title: "Built-In KYC & Fair Play", desc: "Integrated anti-cheat guidelines, identity validation, and automated communication tools." },
  ];

  const faqs = [
    {
      q: "What is ONPE (Online National Event Platform)?",
      a: "ONPE is a unified digital ecosystem designed to discover, organize, and manage esports tournaments, hackathons, and national-level tech events across India.",
    },
    {
      q: "How can organizers get verified on ONPE?",
      a: "Organizers can complete the identity verification (KYC) inside their Organizer Profile Dashboard by submitting official company or institutional credentials.",
    },
    {
      q: "Is ONPE free for participants?",
      a: "Yes! Exploring events, saving bookmarks, and participating in free community competitions on ONPE is 100% free.",
    },
    {
      q: "How does ONPE ensure event authenticity?",
      a: "Every published competition undergoes strict moderation and host verification before being listed publicly on the platform.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-3 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-2xl sm:p-12">
          {/* Subtle Glow Effects */}
          <div className="absolute -right-12 -top-12 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>India's Leading Event Infrastructure</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
              Powering Next-Gen Competitions at <span className="text-emerald-400">ONPE</span>
            </h1>

            <p className="text-xs font-normal leading-relaxed text-slate-300 sm:text-sm md:text-base">
              <strong className="text-white">ONPE (Online National Event Platform)</strong> is building the standard for national-level hackathons, esports championships, and developer summits. We connect thousands of competitive minds with world-class organizers through high-performance digital workflows.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#ecosystem"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
              >
                <span>Explore Ecosystem</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#faqs"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
              >
                <span>Platform FAQs</span>
              </a>
            </div>
          </div>
        </div>

        {/* LIVE METRICS WIDGET */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm sm:p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium">{item.label}</span>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="text-xl font-extrabold text-white sm:text-3xl">{item.value}</p>
                <span className="inline-block text-[10px] font-semibold text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {item.change}
                </span>
              </div>
            );
          })}
        </div>

        {/* MISSION & VISION */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Target className="h-5 w-5" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Our Mission
              </h2>
            </div>
            <h3 className="text-base font-bold text-white sm:text-lg">
              Democratizing Access to Competitions
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed sm:text-sm">
              We eliminate technical friction between event organizers and participants, giving creators automated event tools and participants a unified dashboard to showcase their skills.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sky-400">
              <Award className="h-5 w-5" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Our Vision
              </h2>
            </div>
            <h3 className="text-base font-bold text-white sm:text-lg">
              Building the Digital Event Standard
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed sm:text-sm">
              To empower over 10,000+ national communities and institutions with automated leaderboard tracking, seamless participant verification, and instant event scaling.
            </p>
          </div>
        </div>

        {/* INTERACTIVE ECOSYSTEM TAB SECTION */}
        <div id="ecosystem" className="space-y-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="text-lg font-bold text-white sm:text-2xl">
                Built For Both <span className="text-emerald-400">Participants</span> & <span className="text-sky-400">Organizers</span>
              </h2>
              <p className="text-xs text-slate-400">Switch tabs to see how ONPE creates value for both sides</p>
            </div>

            {/* Tab Controls */}
            <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-1">
              <button
                onClick={() => setActiveTab("participants")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "participants"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                For Participants
              </button>
              <button
                onClick={() => setActiveTab("organizers")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "organizers"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                For Organizers
              </button>
            </div>
          </div>

          {/* Feature Grid Based on Active Tab */}
          <div className="grid gap-4 md:grid-cols-3">
            {(activeTab === "participants" ? participantFeatures : organizerFeatures).map((feat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 transition-all hover:border-slate-700"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ACCORDION FAQ SECTION */}
        <div id="faqs" className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white sm:text-2xl">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Everything you need to know about the ONPE platform</p>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-800 bg-slate-900/60 transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold text-slate-200 hover:text-white sm:text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      openFaq === index ? "rotate-180 text-emerald-400" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="border-t border-slate-800/80 px-4 pb-4 pt-3 text-xs text-slate-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT / CTA BANNER */}
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:flex-row sm:p-8">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-white sm:text-xl">Have questions or want to partner with ONPE?</h3>
            <p className="text-xs text-slate-400">Our support team and event specialists are available 24/7.</p>
          </div>

          <a
            href="mailto:support@onpe.com"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95"
          >
            <Mail className="h-4 w-4" />
            <span>Contact Support</span>
          </a>
        </div>

      </div>
    </div>
  );
}