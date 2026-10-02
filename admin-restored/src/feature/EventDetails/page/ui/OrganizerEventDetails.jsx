import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, Settings2, Trash2 } from "lucide-react";

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

import { useOrganizerEventDetails } from "../../hook/useOrganizerEventDetails.jsx";

const EVENT_TABS = [
  { id: "overview-section", label: "Overview" },
  { id: "prizes-section", label: "Prizes" },
  { id: "how-to-join-section", label: "How To Join" },
  { id: "rules-section", label: "Rules" },
  { id: "organizer-section", label: "Organizer" },
];

export const OrganizerEventDetails = ({
  event: propEvent,
  eventId: propEventId,
  onBack,
  statusDraft: parentStatusDraft,
  setStatusDraft: setParentStatusDraft,
  statusReason: parentStatusReason,
  setStatusReason: setParentStatusReason,
  updatingStatus: parentUpdatingStatus,
  onStatusUpdate,
  onEditOpen,
  deletingEvent: parentDeletingEvent,
  onDeleteEvent,
}) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const id = propEventId || routeId;

  const hookResult = useOrganizerEventDetails(id);
  const event = hookResult.event || propEvent;
  const loading = id ? hookResult.loading : false;
  const error = id ? hookResult.error : null;
  const isBookmarked = hookResult.isBookmarked;
  const toggleBookmark = hookResult.toggleBookmark;
  const refetch = hookResult.refetch;

  const [activeTab, setActiveTab] = useState("overview-section");
  const [localStatusDraft, setLocalStatusDraft] = useState("upcoming");
  const [localStatusReason, setLocalStatusReason] = useState("");
  const [localUpdatingStatus, setLocalUpdatingStatus] = useState(false);
  const [localDeletingEvent, setLocalDeletingEvent] = useState(false);
  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [resultEntries, setResultEntries] = useState([{ participation: "Solo", position: "", name: "" }]);
  const [savingResult, setSavingResult] = useState(false);
  const [completingEvent, setCompletingEvent] = useState(false);
  const [completionConfirmOpen, setCompletionConfirmOpen] = useState(false);
  const [completionPreviousStatus, setCompletionPreviousStatus] = useState("upcoming");

  const statusDraft = parentStatusDraft ?? localStatusDraft;
  const setStatusDraft = setParentStatusDraft ?? setLocalStatusDraft;
  const statusReason = parentStatusReason ?? localStatusReason;
  const setStatusReason = setParentStatusReason ?? setLocalStatusReason;
  const updatingStatus = parentUpdatingStatus ?? localUpdatingStatus;
  const deletingEvent = parentDeletingEvent ?? localDeletingEvent;

  useEffect(() => {
    if (event?.status) {
      if (!parentStatusDraft) {
        setLocalStatusDraft(event.status);
      }
      if (!parentStatusReason) {
        setLocalStatusReason(event.statusReason || "");
      }
    }
  }, [event?.status, event?.statusReason, parentStatusDraft, parentStatusReason]);

  useEffect(() => {
    if (!event) return;

    const existingResults = Array.isArray(event.results) && event.results.length > 0 ? event.results : [];
    const nextEntries = existingResults.length > 0
      ? existingResults.map((entry) => ({
          participation: String(entry?.participation ?? entry?.participationType ?? "Solo").trim() || "Solo",
          position: String(entry?.position ?? "").trim(),
          name: String(entry?.name ?? entry?.winnerName ?? "").trim(),
        }))
      : [{ participation: "Solo", position: "", name: "" }];

    setResultEntries(nextEntries);
  }, [event]);

  const isOfficiallyCompleted = Boolean(event?.completionConfirmedAt) || (
    String(event?.status || "").toLowerCase() === "completed" && Array.isArray(event?.results) && event.results.length > 0
  );
  const isCompleteActionAvailable = Boolean(event) && String(event?.status || "").toLowerCase() !== "completed";

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate("/admin/events");
  };

  const handleShare = async () => {
    if (!event) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title || "Competition Details",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      // User cancelled share
    }
  };

  const handleAskQuestion = () => {
    const contactSection = document.getElementById("contact-section");

    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    const whatsappNumber =
      event?.organizer?.whatsappNumber || event?.organizer?.phone;

    if (whatsappNumber) {
      const message = encodeURIComponent(
        `Hello, I have a question regarding "${event?.title}".`,
      );

      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
    }
  };

  const handleStatusUpdate = async () => {
    if (onStatusUpdate) {
      onStatusUpdate();
      return;
    }

    if (!id || !event || !statusDraft) return;

    if (statusDraft === "completed") {
      setCompletionPreviousStatus(event?.status || "upcoming");
      setCompletionConfirmOpen(true);
      return;
    }

    const normalizedReason =
      statusDraft === "cancelled" || statusDraft === "postponed"
        ? (statusReason || "").trim()
        : "";

    if ((statusDraft === "cancelled" || statusDraft === "postponed") && !normalizedReason) {
      toast.error("Please add a reason before marking this event as cancelled or postponed.");
      return;
    }

    try {
      setLocalUpdatingStatus(true);
      const payload = {
        status: statusDraft,
        statusReason: normalizedReason,
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/events/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to update event status.");
      }

      if (refetch) {
        await refetch();
      }
      toast.success("Event status updated successfully.");
    } catch (updateError) {
      toast.error(updateError?.message || "Unable to update event status.");
    } finally {
      setLocalUpdatingStatus(false);
    }
  };

  const handleCompleteSelection = (nextValue) => {
    if (nextValue === "completed") {
      setCompletionPreviousStatus(statusDraft || event?.status || "upcoming");
      setStatusDraft("completed");
      setCompletionConfirmOpen(true);
      return;
    }

    setStatusDraft(nextValue);
  };

  const cancelCompletionConfirmation = () => {
    setStatusDraft(completionPreviousStatus || event?.status || "upcoming");
    setCompletionConfirmOpen(false);
  };

  const handleCompleteEvent = async () => {
    if (!id || !event || !isCompleteActionAvailable) {
      toast.error("This event is already completed.");
      return;
    }

    try {
      setCompletingEvent(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/events/${id}/complete`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to complete the event.");
      }

      setCompletionConfirmOpen(false);
      if (refetch) {
        await refetch();
      }
      toast.success("Event marked as completed.");
    } catch (completeError) {
      toast.error(completeError?.message || "Unable to complete the event.");
    } finally {
      setCompletingEvent(false);
    }
  };

  const handleResultEntryChange = (index, field, value) => {
    setResultEntries((prev) => prev.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handleAddResultEntry = () => {
    setResultEntries((prev) => [...prev, { participation: "Solo", position: "", name: "" }]);
  };

  const handleSaveResult = async () => {
    if (!id || !isOfficiallyCompleted) {
      toast.error("Results can only be saved after the event is finally completed.");
      return;
    }

    const normalizedEntries = resultEntries
      .map((entry) => ({
        participation: String(entry?.participation ?? "Solo").trim() || "Solo",
        position: String(entry?.position ?? "").trim(),
        name: String(entry?.name ?? "").trim(),
      }))
      .filter((entry) => entry.position || entry.name || entry.participation);

    if (normalizedEntries.length === 0) {
      toast.error("Please add at least one result entry.");
      return;
    }

    const hasEmptyValue = normalizedEntries.some((entry) => !entry.position || !entry.name);
    if (hasEmptyValue) {
      toast.error("Each result entry needs a position and a name.");
      return;
    }

    try {
      setSavingResult(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/events/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          results: normalizedEntries.map((entry) => ({
            participation: entry.participation,
            participationType: entry.participation,
            position: entry.position,
            name: entry.name,
            winnerName: entry.name,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to save result.");
      }

      if (refetch) {
        await refetch();
      }
      setResultFormOpen(false);
      toast.success("Winner result saved successfully.");
    } catch (saveError) {
      toast.error(saveError?.message || "Unable to save result.");
    } finally {
      setSavingResult(false);
    }
  };

  const handleEditEvent = () => {
    if (onEditOpen) {
      onEditOpen();
      return;
    }

    if (!id) return;
    navigate(`/admin/events/${id}/edit`);
  };

  const handleDeleteEvent = async () => {
    if (onDeleteEvent) {
      onDeleteEvent();
      return;
    }

    if (!id || !event) return;

    const confirmed = window.confirm(
      `Delete "${event.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLocalDeletingEvent(true);
      toast.success("Event deleted successfully.");
      navigate("/admin/events");
    } catch (deleteError) {
      toast.error(deleteError?.message || "Unable to delete event.");
    } finally {
      setLocalDeletingEvent(false);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
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
          Back to Event List
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
              onClick={() => navigate("/admin/events")}
              className="transition-colors hover:text-slate-200"
            >
              Admin Events
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

            <div id="prizes-section">
              {event.prizes?.length > 0 ? <PrizeSection prizes={event.prizes} /> : null}
            </div>

            {isOfficiallyCompleted && Array.isArray(event.results) && event.results.length > 0 && (
              <div id="results-section" className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Result</p>
                    <h3 className="text-lg font-semibold text-white">Winner Announcement</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {event.results.map((result, index) => (
                    <div key={`${result.position || "winner"}-${index}`} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
                          {result.position || "Winner"}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          {result.participation || result.participationType || "Solo"}
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-bold text-white">{result.name || result.winnerName || "Winner"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <EntryFee entryFee={event.entryFee} />

            <div id="how-to-join-section">
              <HowToJoin steps={event.howToJoin} />
            </div>

            <div id="rules-section">
              <TermsAndConditions terms={event.terms} initialOpen={true} />
            </div>

            {event.securityRequirements && event.securityRequirements.length > 0 && (
              <TermsAndConditions
                terms={event.securityRequirements}
                title="Security & Compliance"
                countLabel="Requirements"
                toggleLabel="requirements"
                initialOpen={true}
              />
            )}
          </div>

          <aside className="space-y-6">
            {((event.status === "cancelled" ||
              event.status === "canceled" ||
              event.status === "cancel" ||
              event.status === "postponed" ||
              event.status === "postpond" ||
              event.status === "pospond") &&
              event.statusReason) && (
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
                  onChange={(event) => handleCompleteSelection(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="ended">Ended</option>
                  <option value="completed">Complete</option>
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
                  disabled={updatingStatus || !statusDraft || statusDraft === "completed"}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-500 hover:text-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>

                <button
                  type="button"
                  onClick={handleEditEvent}
                  className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Edit in Form
                </button>

                {isOfficiallyCompleted && (
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
                        {resultEntries.map((entry, index) => (
                          <div key={`${index}-${entry.participation || "solo"}`} className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Result Entry #{index + 1}
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
                              <option value="Group">Group</option>
                            </select>

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
                        ))}

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
                  disabled={deletingEvent}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingEvent ? "Deleting..." : "Delete Event"}
                </button>
              </div>
            </div>

            {completionConfirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-5 shadow-2xl">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-amber-400">Warning</div>
                  <p className="text-sm leading-6 text-slate-200">
                    Warning: Completing this event is a final action. After completion, the Edit Form and normal Status Update will no longer be available.
                  </p>
                  <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelCompletionConfirmation}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteEvent}
                      disabled={completingEvent}
                      className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {completingEvent ? "Completing..." : "Yes, Complete"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div id="organizer-section">
              <OrganizerCard organizer={event.organizer} />
            </div>

            <div id="team-members-section">
              <OrganizerMembers members={event.organizer?.members} />
            </div>

            {/* <PaymentNotice /> */}

            {/* <div id="contact-section">
              <ContactOrganizer
                whatsappNumber={
                  event.organizer?.whatsappNumber || event.organizer?.phone
                }
                onAskQuestion={handleAskQuestion}
              />
            </div> */}
          </aside>
        </div>
      </div>
    </main>
  );
};

export default OrganizerEventDetails;
