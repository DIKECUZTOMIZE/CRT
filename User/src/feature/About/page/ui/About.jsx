import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { apiClient } from "../../../../app/config/axios.js";

const formatMetricValue = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("participants"); // "participants" | "organizers"
  const [openFaq, setOpenFaq] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: null,
    totalOrganizers: null,
    totalCompetitions: null,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setIsStatsLoading(true);
        setStatsError("");

        const response = await apiClient.get("/api/about/stats");
        const payload = response?.data?.data ?? {};

        if (!isMounted) {
          return;
        }

        setStats({
          totalUsers: Number(payload.totalUsers ?? 0),
          totalOrganizers: Number(payload.totalOrganizers ?? 0),
          totalCompetitions: Number(payload.totalCompetitions ?? 0),
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStats({
          totalUsers: 0,
          totalOrganizers: 0,
          totalCompetitions: 0,
        });
        setStatsError(error?.message || "Unable to load platform stats.");
      } finally {
        if (isMounted) {
          setIsStatsLoading(false);
        }
      }
    };

    void fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const metrics = [
    { label: "Total Users", value: isStatsLoading ? "—" : formatMetricValue(stats.totalUsers), change: statsError ? "Unavailable" : "Live database count", icon: Users, color: "text-emerald-600" },
    { label: "Organizers", value: isStatsLoading ? "—" : formatMetricValue(stats.totalOrganizers), change: statsError ? "Unavailable" : "Verified role count", icon: Trophy, color: "text-emerald-700" },
    { label: "Competitions", value: isStatsLoading ? "—" : formatMetricValue(stats.totalCompetitions), change: statsError ? "Unavailable" : "Live event count", icon: Building2, color: "text-teal-600" },
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
    <div className="min-h-screen bg-emerald-50/40 p-3 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        
        {/* HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-12">
          {/* Subtle Glow Effects */}
          <div className="absolute -right-12 -top-12 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span>India's Leading Event Infrastructure</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
              Powering Next-Gen Competitions at <span className="text-emerald-600">ONPE</span>
            </h1>

            <p className="text-xs font-normal leading-relaxed text-slate-700 sm:text-sm md:text-base">
              <strong className="text-slate-900">ONPE (Online National Event Platform)</strong> is building the standard for national-level hackathons, esports championships, and developer summits. We connect thousands of competitive minds with world-class organizers through high-performance digital workflows.
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
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-emerald-50 hover:text-slate-900"
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
                className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-xs font-medium">{item.label}</span>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="text-xl font-extrabold text-slate-900 sm:text-3xl">{item.value}</p>
                <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {item.change}
                </span>
              </div>
            );
          })}
        </div>

        {/* MISSION & VISION */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <Target className="h-5 w-5" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Our Mission
              </h2>
            </div>
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
              Democratizing Access to Competitions
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed sm:text-sm">
              We eliminate technical friction between event organizers and participants, giving creators automated event tools and participants a unified dashboard to showcase their skills.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <Award className="h-5 w-5" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Our Vision
              </h2>
            </div>
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
              Building the Digital Event Standard
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed sm:text-sm">
              To empower over 10,000+ national communities and institutions with automated leaderboard tracking, seamless participant verification, and instant event scaling.
            </p>
          </div>
        </div>

        {/* INTERACTIVE ECOSYSTEM TAB SECTION */}
        <div id="ecosystem" className="space-y-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-2xl">
                Built For Both <span className="text-emerald-600">Participants</span> & <span className="text-emerald-700">Organizers</span>
              </h2>
              <p className="text-xs text-slate-600">Switch tabs to see how ONPE creates value for both sides</p>
            </div>

            {/* Tab Controls */}
            <div className="flex rounded-xl border border-emerald-100 bg-white p-1">
              <button
                onClick={() => setActiveTab("participants")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "participants"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                For Participants
              </button>
              <button
                onClick={() => setActiveTab("organizers")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "organizers"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
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
                className="rounded-2xl border border-emerald-100 bg-white p-5 space-y-3 transition-all hover:border-emerald-200"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ACCORDION FAQ SECTION */}
        <div id="faqs" className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-900 sm:text-2xl">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-600">Everything you need to know about the ONPE platform</p>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-emerald-100 bg-white transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold text-slate-800 hover:text-slate-900 sm:text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-600 transition-transform ${
                      openFaq === index ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="border-t border-emerald-100 px-4 pb-4 pt-3 text-xs text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT / CTA BANNER */}
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 sm:flex-row sm:p-8">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-900 sm:text-xl">Have questions or want to partner with ONPE?</h3>
            <p className="text-xs text-slate-600">Our support team and event specialists are available 24/7.</p>
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