import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ArrowLeft, ChevronRight, Link2, Settings2, Sparkles, Trash2, Trophy } from "lucide-react";

import DetailAccordion from "../../../../shared/components/ui/DetailAccordion";

import { EventHero } from "../components/EventHero/EventHero.jsx";
import { EventOverview } from "../components/EventOverview/EventOverview.jsx";
import { CompetitionDetails } from "../components/CompetitionDetails/CompetitionDetails.jsx";
import { EventDescription } from "../components/EventDescription/EventDescription.jsx";
import { PrizeSection } from "../components/PrizeSection/PrizeSection.jsx";
import { HowToJoin } from "../components/HowToJoin/HowToJoin.jsx";
import { TermsAndConditions } from "../components/TermsAndConditions/TermsAndConditions.jsx";
import { EntryFee } from "../components/EntryFee/EntryFee.jsx";
import { OrganizerMembers } from "../components/Organizer/OrganizerMembers.jsx";

import { useOrganizerEventDetailsPage } from "../../hook/useOrganizerEventDetailsPage.js";
import {
  getEventStatusSectionVisibility,
  getOptionalEventSectionVisibility,
} from "../../utils/eventSectionVisibility.js";
import { formatCurrency } from "../../utils/eventDetailsUtils.jsx";

const EVENT_TABS = [
  { id: "postpone-section", label: "Postpone Event", section: "postponed" },
  { id: "cancel-section", label: "Cancel Event", section: "cancelled" },
  { id: "overview-section", label: "Event Overview", section: "required" },
  { id: "competition-overview-section", label: "Competition Overview", section: "required" },
  { id: "description-section", label: "Description", section: "required" },
  { id: "entry-section", label: "Entry", section: "entry" },
  { id: "prizes-section", label: "Prizes", section: "prizes" },
  { id: "results-section", label: "Winner", section: "required" },
  { id: "how-to-join-section", label: "How To Join", section: "howToJoin" },
  { id: "rules-section", label: "Rules", section: "rules" },
  { id: "security-section", label: "Security", section: "security" },
  { id: "organizer-section", label: "Organizer Team", section: "organizerTeam" },
  { id: "maintenance-section", label: "Maintenance", section: "required" },
];

export const OrganizerEventDetails = () => {
  const { id } = useParams();
  const [sectionOpen, setSectionOpen] = useState({
    eventInformation: false,
    competitionOverview: false,
    overview: false,
    prizes: false,
    winner: false,
    howToJoin: false,
    rules: false,
    security: false,
    organizer: false,
    maintenance: false,
  });

  const {
    event,
    rawEvent,
    loading,
    error,
    isBookmarked,
    toggleBookmark,
    activeTab,
    setActiveTab,
    statusDraft,
    handleStatusDraftChange,
    statusReason,
    setStatusReason,
    updatingStatus,
    deletingEvent,
    handleBack,
    handleShare,
    handleStatusUpdate,
    handleStatusConfirmation,
    handleEditEvent,
    handleCompleteEvent,
    cancelCompletionConfirmation,
    handleSaveResult,
    handleAddResultEntry,
    handleRemoveResultEntry,
    handleResultEntryChange,
    handleDeleteEvent,
    isOfficiallyCompleted,
    canAnnounceResults,
    completingEvent,
    completionConfirmOpen,
    finalCancelWarningOpen,
    setFinalCancelWarningOpen,
    savingResult,
    resultEntries,
    resultFormOpen,
    setResultFormOpen,
  } = useOrganizerEventDetailsPage(id);

  const showOfficialCompletionSection = Boolean(canAnnounceResults);
  const optionalSections = getOptionalEventSectionVisibility(rawEvent);
  const statusSections = getEventStatusSectionVisibility(rawEvent?.status);

  useEffect(() => {
    if (!event || typeof IntersectionObserver === "undefined") return undefined;

    const sections = EVENT_TABS
      .map(({ id: sectionId }) => document.getElementById(sectionId))
      .filter(Boolean);

    if (sections.length === 0) return undefined;

    const updateActiveSection = () => {
      const activationOffset = 136;
      let activeSection =
        sections.find((section) => section.id === "overview-section") || sections[0];

      for (const section of sections) {
        if (section.getBoundingClientRect().top > activationOffset) break;
        activeSection = section;
      }

      setActiveTab(activeSection.id);
    };

    const observer = new IntersectionObserver(updateActiveSection, {
      rootMargin: "-136px 0px 0px 0px",
      threshold: 0,
    });

    sections.forEach((section) => observer.observe(section));
    updateActiveSection();

    return () => observer.disconnect();
  }, [event, rawEvent, setActiveTab]);

  const rawDescription = rawEvent?.description;
  const hasDescriptionContent =
    (typeof rawDescription === "string" && rawDescription.trim().length > 0) ||
    (rawDescription &&
      typeof rawDescription === "object" &&
      !Array.isArray(rawDescription) &&
      [
        rawDescription.whatIsThis,
        rawDescription.tagline,
        rawDescription.about,
        rawDescription.description,
        rawDescription.summary,
        rawDescription.text,
        rawDescription.whatToPrepare,
        rawDescription.prepare,
        rawDescription.customSeatDetails,
      ].some((value) => typeof value === "string" && value.trim().length > 0)) ||
    Boolean(rawEvent?.tagline?.trim?.()) ||
    Boolean(rawEvent?.customSeatDetails?.trim?.());
  const winnerCategories = (Array.isArray(event?.results) ? event.results : []).reduce((categories, result) => {
    const winnerName = String(result?.name || result?.winnerName || "").trim();
    const position = String(result?.position || "").trim();
    const rawCategory = String(result?.participation || result?.participationType || "").trim();
    if (!winnerName || !position || !rawCategory) return categories;

    const categoryValue = rawCategory.toLowerCase() === "solo"
      ? "Solo"
      : rawCategory.toLowerCase() === "team"
        ? "Team"
        : rawCategory;
    const existingCategory = categories.find((category) => category.value === categoryValue);
    const winner = { position, name: winnerName };

    if (existingCategory) {
      existingCategory.winners.push(winner);
    } else {
      categories.push({ value: categoryValue, winners: [winner] });
    }

    return categories;
  }, []);
  const [activeWinnerCategory, setActiveWinnerCategory] = useState("");
  const selectedWinnerCategory =
    winnerCategories.find((category) => category.value === activeWinnerCategory) || winnerCategories[0];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSectionOpen((prev) => ({
      ...prev,
      eventInformation: tabId === "overview-section" ? true : prev.eventInformation,
      competitionOverview:
        tabId === "overview-section" || tabId === "competition-overview-section"
          ? true
          : prev.competitionOverview,
      overview: tabId === "overview-section" ? true : prev.overview,
      prizes: tabId === "prizes-section" ? true : prev.prizes,
      winner: tabId === "results-section" ? true : prev.winner,
      howToJoin: tabId === "how-to-join-section" ? true : prev.howToJoin,
      rules: tabId === "rules-section" ? true : prev.rules,
      security: tabId === "security-section" ? true : prev.security,
      organizer: tabId === "organizer-section" ? true : prev.organizer,
      maintenance: tabId === "maintenance-section" ? true : prev.maintenance,
    }));

    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
              onClick={handleBack}
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
        />

        <div className="sticky top-4 z-40 flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/80 p-1.5 backdrop-blur-xl scrollbar-none no-scrollbar">
          {EVENT_TABS.filter((tab) =>
            tab.section === "required" ||
            optionalSections[tab.section] ||
            statusSections[tab.section]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              aria-current={activeTab === tab.id ? "location" : undefined}
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

        <div className="space-y-6">
          <div className="space-y-6">
            {statusSections.postponed && (
              <div
                id="postpone-section"
                className="scroll-mt-32 rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4 shadow-lg ring-1 ring-inset ring-violet-500/20"
              >
                <h2 className="text-sm font-bold text-violet-200">Postpone Event</h2>
                <p className="mt-2 break-words text-sm leading-relaxed text-violet-100">
                  {event.statusReason || "This event has been postponed."}
                </p>
              </div>
            )}

            {statusSections.cancelled && (
              <div
                id="cancel-section"
                className="scroll-mt-32 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 shadow-lg ring-1 ring-inset ring-rose-500/20"
              >
                <h2 className="text-sm font-bold text-rose-200">Cancel Event</h2>
                <p className="mt-2 break-words text-sm leading-relaxed text-rose-100">
                  {event.statusReason || "This event has been cancelled."}
                </p>
              </div>
            )}

            <div id="overview-section" className="scroll-mt-32">
              <EventOverview
                meta={event.meta}
                overview={event.overview}
                open={sectionOpen.eventInformation}
                onToggle={(next) => setSectionOpen((prev) => ({ ...prev, eventInformation: next }))}
              />
              {event.onlineLink && (
                <DetailAccordion
                  title="Meeting Details"
                  icon={Link2}
                  initialOpen={false}
                  viewLabel="View details"
                  hideLabel="Hide details"
                  iconClassName="panel-icon--emerald"
                  bodyClassName="panel-body--stacked"
                >
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                    <p className="text-xs font-semibold text-slate-400">Meeting Link</p>
                    <a
                      href={event.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block break-all text-sm font-medium text-emerald-400 underline decoration-emerald-500/40 underline-offset-4 hover:text-emerald-300"
                    >
                      {event.onlineLink}
                    </a>
                  </div>
                </DetailAccordion>
              )}
            </div>

            <div id="competition-overview-section" className="scroll-mt-32">
              <CompetitionDetails
                details={event.competitionDetails}
                open={sectionOpen.competitionOverview}
                onToggle={(next) => setSectionOpen((prev) => ({ ...prev, competitionOverview: next }))}
              />
            </div>

            <div id="description-section" className="scroll-mt-32">
              {hasDescriptionContent ? (
                <EventDescription description={event.description} />
              ) : (
                <DetailAccordion
                  title="Description"
                  icon={Sparkles}
                  initialOpen={false}
                  viewLabel="View details"
                  hideLabel="Hide details"
                  iconClassName="panel-icon--emerald"
                  bodyClassName="panel-body--stacked"
                >
                  <p className="text-sm text-slate-400">No event description added yet.</p>
                </DetailAccordion>
              )}
            </div>

            {optionalSections.entry && (
              <div id="entry-section" className="scroll-mt-32">
                <EntryFee entryFee={event.entryFee} />
              </div>
            )}

            {optionalSections.prizes && (
              <div id="prizes-section" className="scroll-mt-32">
                {Number(rawEvent?.totalPrizePool) > 0 && (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
                    <span className="text-sm font-semibold text-amber-200">Total Prize Pool</span>
                    <span className="text-sm font-black text-amber-300">
                      {formatCurrency(Number(rawEvent.totalPrizePool))}
                    </span>
                  </div>
                )}
                <PrizeSection prizes={event.prizes} />
              </div>
            )}

            <div id="results-section" className="scroll-mt-32">
              <DetailAccordion
                title="Winner"
                icon={Trophy}
                initialOpen={false}
                open={sectionOpen.winner}
                onToggle={(next) => setSectionOpen((prev) => ({ ...prev, winner: next }))}
                viewLabel="View details"
                hideLabel="Hide details"
                iconClassName="panel-icon--emerald"
                bodyClassName="panel-body--stacked"
              >
                <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/90 p-3 shadow-xl sm:p-4">
                  {winnerCategories.length > 0 ? (
                    <>
                      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
                            <Trophy className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Winner</p>
                            <h3 className="text-lg font-semibold text-white">Winner Announcement</h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
                          <Sparkles className="h-3 w-3 text-emerald-400" />
                          <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-emerald-300">
                            {winnerCategories.reduce((total, category) => total + category.winners.length, 0)} Winners
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Winner categories">
                          {winnerCategories.map((category) => (
                            <button
                              key={category.value}
                              type="button"
                              role="tab"
                              aria-selected={selectedWinnerCategory?.value === category.value}
                              onClick={() => setActiveWinnerCategory(category.value)}
                              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                selectedWinnerCategory?.value === category.value
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                                  : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600"
                              }`}
                            >
                              {category.value === "Team"
                                ? "Group / Team"
                                : category.value}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-3" role="tabpanel">
                          {selectedWinnerCategory?.winners.map((winner, index) => (
                            <div
                              key={`${winner.position}-${winner.name}-${index}`}
                              className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                                <Trophy className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                  {winner.position}
                                </p>
                                <p className="truncate text-base font-bold text-white sm:text-lg">
                                  {winner.name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 border-b border-slate-700/80 pb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Winner</p>
                          <h3 className="text-lg font-semibold text-white">Not Announced Yet</h3>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-center">
                        <p className="text-sm font-medium text-slate-300">
                          Winner results will be published here after announcement.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </DetailAccordion>
            </div>

            {optionalSections.howToJoin && (
              <div id="how-to-join-section" className="scroll-mt-32">
                <HowToJoin
                  steps={event.howToJoin}
                  open={sectionOpen.howToJoin}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, howToJoin: next }))}
                />
              </div>
            )}

            {optionalSections.rules && (
              <div id="rules-section" className="scroll-mt-32">
                <TermsAndConditions
                  terms={event.terms}
                  initialOpen={false}
                  open={sectionOpen.rules}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, rules: next }))}
                />
              </div>
            )}

            {optionalSections.security && (
              <div id="security-section" className="scroll-mt-32">
                <TermsAndConditions
                  terms={event.securityRequirements}
                  title="Security & Compliance"
                  countLabel="Requirements"
                  toggleLabel="requirements"
                  initialOpen={false}
                  open={sectionOpen.security}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, security: next }))}
                />
              </div>
            )}

            {optionalSections.organizerTeam && (
              <div id="organizer-section" className="scroll-mt-32">
                <OrganizerMembers
                  members={event.organizer?.members}
                  open={sectionOpen.organizer}
                  onToggle={(next) => setSectionOpen((prev) => ({ ...prev, organizer: next }))}
                />
              </div>
            )}

          </div>

          <div id="maintenance-section" className="scroll-mt-32 space-y-6">
            <DetailAccordion
              title="Maintenance"
              icon={Settings2}
              initialOpen={false}
              open={sectionOpen.maintenance}
              onToggle={(next) => setSectionOpen((prev) => ({ ...prev, maintenance: next }))}
              viewLabel="View details"
              hideLabel="Hide details"
              iconClassName="panel-icon--emerald"
              bodyClassName="panel-body--stacked"
            >
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Settings2 className="h-4 w-4 text-emerald-400" />
                  Maintenance
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    Event Status
                  </label>

                  <select
                    value={statusDraft}
                    onChange={(changeEvent) => handleStatusDraftChange(changeEvent.target.value)}
                    disabled={isOfficiallyCompleted || canAnnounceResults}
                    className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="ended">Ended</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="postponed">Postponed</option>
                  </select>

                  {(statusDraft === "cancelled" || statusDraft === "postponed") && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                        Reason
                      </label>
                      <textarea
                        value={statusReason}
                        onChange={(event) => setStatusReason(event.target.value)}
                        rows={3}
                        placeholder={
                          statusDraft === "cancelled"
                            ? "Enter cancellation reason"
                            : "Enter postponement reason"
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus || !statusDraft || isOfficiallyCompleted || canAnnounceResults}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-500 hover:text-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {updatingStatus ? "Updating..." : "Update Status"}
                  </button>

                  <button
                    type="button"
                    onClick={handleEditEvent}
                    disabled={isOfficiallyCompleted || canAnnounceResults}
                    className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    Edit in Form
                  </button>

                  {completionConfirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-5 shadow-2xl">
                        <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                          {statusDraft === "completed" ? "Warning" : "Confirm Status"}
                        </div>
                        <p className="text-sm leading-6 text-slate-200">
                          {statusDraft === "completed"
                            ? "Warning: Completing this event is a final action. After completion, the Edit Form will no longer be available."
                            : statusDraft === "cancelled"
                              ? "Choose the type of cancellation for this event."
                              : "This will mark the event as postponed. It is a normal status change, and the event will remain editable after confirmation."}
                        </p>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          {statusDraft === "cancelled" ? (
                            <>
                              <button
                                type="button"
                                onClick={cancelCompletionConfirmation}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
                              >
                                Close
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusConfirmation({ isFinalCancel: false })}
                                disabled={updatingStatus}
                                className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {updatingStatus ? "Updating..." : "Normal Cancel"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setFinalCancelWarningOpen(true)}
                                disabled={updatingStatus}
                                className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {updatingStatus ? "Updating..." : "Final Cancel"}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={cancelCompletionConfirmation}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
                              >
                                Close
                              </button>
                              <button
                                type="button"
                                onClick={statusDraft === "completed" ? handleCompleteEvent : handleStatusConfirmation}
                                disabled={completingEvent || updatingStatus}
                                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {statusDraft === "completed"
                                  ? (completingEvent ? "Completing..." : "Yes, Complete")
                                  : (updatingStatus ? "Updating..." : "Yes, Continue")}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {finalCancelWarningOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-5 shadow-2xl">
                        <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-rose-400">
                          Final cancellation warning
                        </div>
                        <p className="text-sm leading-6 text-slate-200">
                          This is a final cancellation for this event. If you click Yes, the event will be permanently cancelled and the status management and Edit Form will no longer be available.
                        </p>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={cancelCompletionConfirmation}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await handleStatusConfirmation({ isFinalCancel: true });
                              if (confirmed) {
                                setFinalCancelWarningOpen(false);
                              }
                            }}
                            disabled={updatingStatus}
                            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingStatus ? "Updating..." : "Yes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showOfficialCompletionSection && (
                    <div className="space-y-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
                      <button
                        type="button"
                        onClick={() => setResultFormOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-slate-900/80 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300"
                      >
                        <span>Result Announcement</span>
                        <span>{resultFormOpen ? "▼" : "▶"}</span>
                      </button>

                      {resultFormOpen && (
                        <div className="space-y-3 pt-1">
                          {resultEntries.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-400">
                              No result entries added yet.
                            </div>
                          ) : (
                            resultEntries.map((entry, index) => (
                              <div key={`${index}-${entry.participation || 'solo'}`} className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    Result Entry #{index + 1}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveResultEntry(index)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/15"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Remove
                                  </button>
                                </div>

                                <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                  Participation
                                </label>
                                <select
                                  value={entry.participation || "Solo"}
                                  onChange={(event) => handleResultEntryChange(index, "participation", event.target.value)}
                                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                                >
                                  <option value="Solo">Solo</option>
                                  <option value="Team">Team</option>
                                  <option value="Other">Other</option>
                                </select>

                                {entry.participation === "Other" && (
                                  <>
                                    <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                      Custom Participation
                                    </label>
                                    <input
                                      type="text"
                                      value={entry.participationCustom || ""}
                                      onChange={(event) => handleResultEntryChange(index, "participationCustom", event.target.value)}
                                      placeholder="Enter custom participation type"
                                      className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                                    />
                                  </>
                                )}

                                <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                  Position
                                </label>
                                <input
                                  type="text"
                                  value={entry.position}
                                  onChange={(event) => handleResultEntryChange(index, "position", event.target.value)}
                                  placeholder="Enter position"
                                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                                />

                                <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={entry.name}
                                  onChange={(event) => handleResultEntryChange(index, "name", event.target.value)}
                                  placeholder="Enter participant or team name"
                                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                                />
                              </div>
                            ))
                          )}

                          <button
                            type="button"
                            onClick={handleAddResultEntry}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-500 hover:text-emerald-400"
                          >
                            + Add Result
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveResult}
                            disabled={savingResult}
                            className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingResult ? "Saving..." : "Announce Result"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    disabled={deletingEvent || isOfficiallyCompleted}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingEvent ? "Deleting..." : "Delete Event"}
                  </button>
                </div>
              </div>
            </DetailAccordion>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrganizerEventDetails;
