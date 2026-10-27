import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Video } from "lucide-react";

import { EventHero } from "../components/EventHero/EventHero.jsx";
import { EventOverview } from "../components/EventOverview/EventOverview.jsx";
import { CompetitionDetails } from "../components/CompetitionDetails/CompetitionDetails.jsx";
import { EventDescription } from "../components/EventDescription/EventDescription.jsx";
import { PrizeSection } from "../components/PrizeSection/PrizeSection.jsx";
import { ResultsSection } from "../../components/ResultsSection/ResultsSection.jsx";
import { HowToJoin } from "../components/HowToJoin/HowToJoin.jsx";
import { TermsAndConditions } from "../components/TermsAndConditions/TermsAndConditions.jsx";
import { EntryFee } from "../components/EntryFee/EntryFee.jsx";
import { OrganizerMembers } from "../components/Organizer/OrganizerMembers.jsx";
import { PaymentNotice } from "../components/PaymentNotice/PaymentNotice.jsx";
import { ContactOrganizer } from "../components/ContactOrganizer/ContactOrganizer.jsx";
import DetailAccordion from "../../../../shared/components/ui/DetailAccordion.jsx";

import { useUserEventDetailsPage } from "../../hook/useUserEventDetailsPage.js";

const sectionOpenKeyByTab = {
  "overview-section": "overview",
  "competition-overview-section": "competition",
  "description-section": "description",
  "entry-section": "entryFee",
  "prizes-section": "prizes",
  "results-section": "winner",
  "how-to-join-section": "howToJoin",
  "rules-section": "rules",
  "security-section": "security",
  "organizer-team-section": "organizer",
};

export const UserEventDetails = () => {
  const tabBarRef = useRef(null);
  const [meetingDetailsOpen, setMeetingDetailsOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState({
    overview: false,
    description: false,
    competition: false,
    entryFee: false,
    prizes: false,
    winner: false,
    howToJoin: false,
    rules: false,
    security: false,
    organizer: false,
  });

  const {
    event,
    loading,
    error,
    isAuthenticated,
    isBookmarked,
    toggleBookmark,
    activeTab,
    setActiveTab,
    handleBack,
    handleShare,
    handleAskQuestion,
    handleRateEvent,
    EVENT_TABS,
    navigate,
  } = useUserEventDetailsPage();

  const dragRef = useRef({ active: false, moved: false, startX: 0, startLeft: 0 });

  useEffect(() => {
    const bar = tabBarRef.current;
    if (!bar) return undefined;

    // Let a plain vertical mouse wheel scroll the tabs sideways until an edge is reached.
    const handleWheel = (e) => {
      if (e.shiftKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const maxLeft = bar.scrollWidth - bar.clientWidth;
      if (maxLeft <= 0) return;
      const canScroll = e.deltaY > 0 ? bar.scrollLeft < maxLeft - 1 : bar.scrollLeft > 0;
      if (!canScroll) return;
      e.preventDefault();
      bar.scrollLeft += e.deltaY;
    };

    bar.addEventListener("wheel", handleWheel, { passive: false });
    return () => bar.removeEventListener("wheel", handleWheel);
  }, [loading, event]);

  const handleBarPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startLeft: tabBarRef.current.scrollLeft,
    };
  };

  const handleBarPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const delta = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < 5) return;
    drag.moved = true;
    tabBarRef.current.scrollTo({ left: drag.startLeft - delta, behavior: "instant" });
  };

  const handleBarPointerEnd = () => {
    dragRef.current.active = false;
  };

  // Swallow the click that follows a drag so it doesn't trigger a tab.
  const handleBarClickCapture = (e) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const sectionKey = sectionOpenKeyByTab[tabId];
    if (sectionKey) {
      setSectionOpen((prev) => ({ ...prev, [sectionKey]: true }));
    }

    const bar = tabBarRef.current;
    const tabButton = bar?.querySelector(`[data-tab-id="${tabId}"]`);
    if (bar && tabButton) {
      bar.scrollTo({
        left: tabButton.offsetLeft - (bar.clientWidth - tabButton.offsetWidth) / 2,
        behavior: "smooth",
      });
    }

    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFCFA] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200 sm:h-80" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="h-40 w-full animate-pulse rounded-xl bg-slate-200" />
              <div className="h-56 w-full animate-pulse rounded-xl bg-slate-200" />
              <div className="h-32 w-full animate-pulse rounded-xl bg-slate-200" />
            </div>
            <div className="space-y-6">
              <div className="h-36 w-full animate-pulse rounded-xl bg-slate-200" />
              <div className="h-48 w-full animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAFCFA] px-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-center shadow-[0_10px_26px_rgba(15,118,110,0.05)]">
          <p className="text-sm font-medium text-rose-600">
            {error || "Event not found or has been removed."}
          </p>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-[#F8FBF9] hover:text-slate-900 transition-all"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-600" />
          Go Back To Events
        </button>
      </div>
    );
  }

  const hasParticipationSteps = Array.isArray(event.howToJoin) && event.howToJoin.length > 0;
  const hasPrizes = Array.isArray(event.prizes) &&
    event.prizes.some((category) => Array.isArray(category?.prizes) && category.prizes.length > 0);
  const hasRules = Array.isArray(event.terms) && event.terms.length > 0;
  const hasSecurityRequirements =
    Array.isArray(event.securityRequirements) && event.securityRequirements.length > 0;
  const hasOrganizerMembers =
    Array.isArray(event.organizer?.members) && event.organizer.members.length > 0;
  const sectionVisibility = {
    "entry-section": event.hasEntryFeeData,
    "prizes-section": hasPrizes,
    "how-to-join-section": hasParticipationSteps,
    "rules-section": hasRules,
    "security-section": hasSecurityRequirements,
    "organizer-team-section": hasOrganizerMembers,
  };
  const eventStatus = String(event.status || "").trim().toLowerCase();
  const statusSections = {
    postponed: eventStatus === "postponed",
    cancelled: eventStatus === "cancelled",
  };
  const visibleTabs = EVENT_TABS.filter(
    (tab) =>
      !Object.prototype.hasOwnProperty.call(sectionVisibility, tab.id) ||
      Boolean(sectionVisibility[tab.id])
  );

  return (
    <main className="min-h-screen bg-[#FAFCFA] px-4 pb-20 pt-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs text-slate-600">
            <button
              onClick={handleBack}
              className="group flex items-center gap-1 rounded-lg border border-emerald-100 bg-white px-2.5 py-1.5 font-medium text-slate-700 hover:border-emerald-200 hover:bg-[#F8FBF9] hover:text-slate-900 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-emerald-600 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>

            <ChevronRight className="h-3 w-3 text-slate-500" />

            <button
              onClick={() => navigate("/filter")}
              className="transition-colors hover:text-slate-900"
            >
              Events
            </button>

            <ChevronRight className="h-3 w-3 text-slate-500" />

            <span className="max-w-32 truncate text-slate-900 font-medium sm:max-w-xs">
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

        <div
          ref={tabBarRef}
          onPointerDown={handleBarPointerDown}
          onPointerMove={handleBarPointerMove}
          onPointerUp={handleBarPointerEnd}
          onPointerLeave={handleBarPointerEnd}
          onClickCapture={handleBarClickCapture}
          className="sticky top-[4.25rem] z-30 flex items-center gap-2 overflow-x-auto overscroll-x-contain scroll-smooth rounded-xl border border-emerald-100 bg-white p-1.5 shadow-sm no-scrollbar"
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "border border-emerald-200 bg-[#ECFDF5] text-emerald-700"
                  : "text-slate-600 hover:bg-[#F8FBF9] hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {statusSections.postponed && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm ring-1 ring-inset ring-violet-100">
                <h2 className="text-sm font-bold text-violet-800">Postpone Event</h2>
                <p className="mt-2 break-words text-sm leading-relaxed text-violet-900">
                  {event.statusReason || "This event has been postponed."}
                </p>
              </div>
            )}

            {statusSections.cancelled && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm ring-1 ring-inset ring-rose-100">
                <h2 className="text-sm font-bold text-rose-800">Cancel Event</h2>
                <p className="mt-2 break-words text-sm leading-relaxed text-rose-900">
                  {event.statusReason || "This event has been cancelled."}
                </p>
              </div>
            )}

            <div id="overview-section" className="scroll-mt-32">
              <EventOverview
                meta={event.meta}
                overview={event.overview}
                open={sectionOpen.overview}
                onToggle={(next) => setSectionOpen((prev) => ({ ...prev, overview: next }))}
              />
            </div>

            <div id="competition-overview-section" className="scroll-mt-32">
              <CompetitionDetails
                details={event.competitionDetails}
                customFields={event.customFields}
                open={sectionOpen.competition}
                onToggle={(next) => setSectionOpen((prev) => ({ ...prev, competition: next }))}
              />
            </div>

            <div id="description-section" className="scroll-mt-32">
              <EventDescription
                description={event.description}
                open={sectionOpen.description}
                onToggle={(next) => setSectionOpen((prev) => ({ ...prev, description: next }))}
              />
            </div>

            {sectionVisibility["entry-section"] && (
              <div id="entry-section" className="scroll-mt-32">
                <EntryFee
                  entryFee={event.entryFee}
                  open={sectionOpen.entryFee}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, entryFee: next }))}
                />
              </div>
            )}

            {event.onlineLink && (
              <DetailAccordion
                title="Meeting Details"
                icon={Video}
                open={meetingDetailsOpen}
                onToggle={setMeetingDetailsOpen}
                viewLabel="View meeting details"
                hideLabel="Hide details"
                iconClassName="panel-icon--emerald"
                bodyClassName="panel-body--stacked"
              >
                <p className="text-xs font-semibold text-slate-600">Meeting Link</p>
                <a
                  href={event.onlineLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-sm font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-600"
                >
                  {event.onlineLink}
                </a>
              </DetailAccordion>
            )}

            {sectionVisibility["prizes-section"] && (
              <div id="prizes-section" className="scroll-mt-32">
                <PrizeSection
                  prizes={event.prizes}
                  open={sectionOpen.prizes}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, prizes: next }))}
                />
              </div>
            )}

            <div id="results-section" className="scroll-mt-32">
              <ResultsSection
                results={event.results}
                open={sectionOpen.winner}
                onToggle={(next) => setSectionOpen((prev) => ({ ...prev, winner: next }))}
              />
            </div>

            {sectionVisibility["how-to-join-section"] && (
              <div id="how-to-join-section" className="scroll-mt-32">
                <HowToJoin
                  steps={event.howToJoin}
                  open={sectionOpen.howToJoin}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, howToJoin: next }))}
                />
              </div>
            )}

            {sectionVisibility["rules-section"] && (
              <div id="rules-section" className="scroll-mt-32">
                <TermsAndConditions
                  terms={event.terms}
                  open={sectionOpen.rules}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, rules: next }))}
                />
              </div>
            )}

            {sectionVisibility["security-section"] && (
              <div id="security-section" className="scroll-mt-32">
                <TermsAndConditions
                  terms={event.securityRequirements}
                  title="Security & Compliance"
                  countLabel="Requirements"
                  toggleLabel="requirements"
                  open={sectionOpen.security}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, security: next }))}
                />
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {sectionVisibility["organizer-team-section"] && (
              <div id="organizer-team-section" className="scroll-mt-32">
                <OrganizerMembers
                  members={event.organizer?.members}
                  open={sectionOpen.organizer}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, organizer: next }))}
                />
              </div>
            )}

            <div id="contact-section" className="scroll-mt-32">
              <ContactOrganizer
                contactName={event.organizer?.name}
                email={event.organizer?.email}
                whatsappNumber={event.organizer?.whatsappNumber || event.organizer?.phone}
                onAskQuestion={handleAskQuestion}
              />
            </div>

            <PaymentNotice />
          </aside>
        </div>
      </div>
    </main>
  );
};

export default UserEventDetails;
