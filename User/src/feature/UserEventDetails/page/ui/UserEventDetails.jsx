import React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { EventHero } from "../components/EventHero/EventHero.jsx";
import { EventOverview } from "../components/EventOverview/EventOverview.jsx";
import { CompetitionDetails } from "../components/CompetitionDetails/CompetitionDetails.jsx";
import { EventDescription } from "../components/EventDescription/EventDescription.jsx";
import { PrizeSection } from "../components/PrizeSection/PrizeSection.jsx";
import { HowToJoin } from "../components/HowToJoin/HowToJoin.jsx";
import { TermsAndConditions } from "../components/TermsAndConditions/TermsAndConditions.jsx";
import { EntryFee } from "../components/EntryFee/EntryFee.jsx";
import { OrganizerCard } from "../components/Organizer/OrganizerCard.jsx";
import { OrganizerMembers } from "../components/Organizer/OrganizerMembers.jsx";
import { PaymentNotice } from "../components/PaymentNotice/PaymentNotice.jsx";
import { ContactOrganizer } from "../components/ContactOrganizer/ContactOrganizer.jsx";

import { useUserEventDetailsPage } from "../../hook/useUserEventDetailsPage.js";

export const UserEventDetails = () => {
  const {
    event,
    loading,
    error,
    isAuthenticated,
    isBookmarked,
    toggleBookmark,
    activeTab,
    handleBack,
    handleShare,
    handleAskQuestion,
    handleRateEvent,
    scrollToSection,
    EVENT_TABS,
    navigate,
  } = useUserEventDetailsPage();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-900" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-900 sm:h-80" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="h-40 w-full animate-pulse rounded-xl bg-slate-900" />
              <div className="h-56 w-full animate-pulse rounded-xl bg-slate-900" />
              <div className="h-32 w-full animate-pulse rounded-xl bg-slate-900" />
            </div>
            <div className="space-y-6">
              <div className="h-36 w-full animate-pulse rounded-xl bg-slate-900" />
              <div className="h-48 w-full animate-pulse rounded-xl bg-slate-900" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-5 text-center backdrop-blur-xl">
          <p className="text-sm font-medium text-rose-400">
            {error || "Event not found or has been removed."}
          </p>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-400" />
          Go Back To Events
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-20 pt-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={handleBack}
              className="group flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 font-medium text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>

            <ChevronRight className="h-3 w-3 text-slate-600" />

            <button
              onClick={() => navigate("/filter")}
              className="transition-colors hover:text-slate-200"
            >
              Events
            </button>

            <ChevronRight className="h-3 w-3 text-slate-600" />

            <span className="max-w-32 truncate text-slate-200 font-medium sm:max-w-xs">
              {event.title}
            </span>
          </nav>
        </div>

        <EventHero
          event={event}
          isBookmarked={isBookmarked}
          onBookmark={toggleBookmark}
          onShare={handleShare}
          onRate={isAuthenticated ? handleRateEvent : null}
          isAuthenticated={isAuthenticated}
        />

        <div className="sticky top-4 z-40 flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/80 p-1.5 backdrop-blur-xl no-scrollbar">
          {EVENT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div id="overview-section">
              <EventOverview meta={event.meta} overview={event.overview} />
            </div>

            <CompetitionDetails details={event.competitionDetails} />

            <EventDescription description={event.description} />
            <EntryFee entryFee={event.entryFee} />

            <div id="prizes-section">
              <PrizeSection prizes={event.prizes} />
            </div>

            <div id="how-to-join-section">
              <HowToJoin steps={event.howToJoin} />
            </div>

            <div id="rules-section">
              <TermsAndConditions terms={event.terms} />
            </div>

            {event.securityRequirements && event.securityRequirements.length > 0 && (
              <TermsAndConditions
                terms={event.securityRequirements}
                title="Security & Compliance"
                countLabel="Requirements"
                toggleLabel="requirements"
              />
            )}
          </div>

          <aside className="space-y-6">
            {(event.status === "cancelled" ||
              event.status === "canceled" ||
              event.status === "cancel" ||
              event.status === "postponed" ||
              event.status === "postpond" ||
              event.status === "pospond") &&
              event.statusReason && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 shadow-lg ring-1 ring-inset ring-amber-500/20">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                      {event.status === "postponed" || event.status === "postpond" || event.status === "pospond"
                        ? "Postponed"
                        : "Cancelled"}
                    </p>
                  </div>
                  <p className="break-words text-sm font-semibold leading-relaxed text-amber-50">
                    {event.status === "postponed" || event.status === "postpond" || event.status === "pospond"
                      ? `Postponed: ${event.statusReason}`
                      : `Cancelled: ${event.statusReason}`}
                  </p>
                </div>
              )}

            <div id="organizer-section">
              <OrganizerCard organizer={event.organizer} />
            </div>

            <OrganizerMembers members={event.organizer?.members} />

            <PaymentNotice />

            <div id="contact-section">
              <ContactOrganizer
                whatsappNumber={
                  event.organizer?.whatsappNumber || event.organizer?.phone
                }
                onAskQuestion={handleAskQuestion}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default UserEventDetails;
