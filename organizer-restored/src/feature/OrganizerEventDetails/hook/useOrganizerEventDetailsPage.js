import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { completeOrganizerEvent, deleteOrganizerEvent, updateOrganizerEvent } from "../../Event/api/event.api.js";
import { useOrganizerEventDetails } from "./useOrganizerEventDetails.jsx";

const isEventPastEndTime = (event) => {
  if (!event) return false;

  const endDateValue = event.eventEndDate || event.eventEnd || event.eventDate || event.eventStart;
  const endTimeValue = event.eventEndTime || event.eventTime || event.eventStartTime;

  if (!endDateValue) return false;

  const endDate = new Date(endDateValue);
  if (Number.isNaN(endDate.getTime())) return false;

  if (endTimeValue) {
    const trimmed = String(endTimeValue).trim();
    const meridiemMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})\s*([AaPp][Mm])$/);
    let hours;
    let minutes;

    if (meridiemMatch) {
      hours = Number(meridiemMatch[1]);
      minutes = Number(meridiemMatch[2]);
      const period = meridiemMatch[3].toUpperCase();
      if (period === "AM" && hours === 12) hours = 0;
      if (period === "PM" && hours !== 12) hours += 12;
    } else {
      const standardMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})$/);
      if (standardMatch) {
        hours = Number(standardMatch[1]);
        minutes = Number(standardMatch[2]);
      }
    }

    if (typeof hours === "number" && typeof minutes === "number") {
      endDate.setHours(hours, minutes, 0, 0);
    } else {
      endDate.setHours(23, 59, 59, 999);
    }
  } else {
    endDate.setHours(23, 59, 59, 999);
  }

  return new Date() >= endDate;
};

export const useOrganizerEventDetailsPage = (eventId) => {
  const navigate = useNavigate();
  const { event, loading, error, isBookmarked, toggleBookmark, refetch } = useOrganizerEventDetails(eventId);

  const [activeTab, setActiveTab] = useState("overview-section");
  const [statusDraft, setStatusDraft] = useState("upcoming");
  const [statusReason, setStatusReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [completingEvent, setCompletingEvent] = useState(false);
  const [completionConfirmOpen, setCompletionConfirmOpen] = useState(false);
  const [finalCancelWarningOpen, setFinalCancelWarningOpen] = useState(false);
  const [completionPreviousStatus, setCompletionPreviousStatus] = useState("upcoming");
  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [resultEntries, setResultEntries] = useState([{ participation: "Solo", participationCustom: "", position: "", name: "" }]);
  const [savingResult, setSavingResult] = useState(false);

  const eventStatus = String(event?.status || "").toLowerCase();
  const isDisplayCompleted = !!event && (isEventPastEndTime(event) || eventStatus === "completed");
  const hasLegacyCompletedResults = !!event && eventStatus === "completed" && Array.isArray(event.results) && event.results.length > 0;
  const hasOfficialCompletion = !!event && Boolean(event.completionConfirmedAt);
  const isOfficiallyCompleted = hasOfficialCompletion;
  const isCompleted = isDisplayCompleted;
  const isFinalCompleted = hasOfficialCompletion;
  const canComplete = false;
  const canFinalizeCompletion = isDisplayCompleted && !hasOfficialCompletion;

  useEffect(() => {
    if (event?.status) {
      setStatusDraft(event.status);
      setStatusReason(event.statusReason || "");
    }
  }, [event?.status, event?.statusReason]);

  useEffect(() => {
    if (!event) return;

    const existingResults = Array.isArray(event.results) && event.results.length > 0 ? event.results : [];
    const nextEntries = existingResults.length > 0
      ? existingResults.map((entry) => ({
          participation: String(entry?.participation ?? entry?.participationType ?? "Solo").trim() || "Solo",
          participationCustom: String(entry?.participationCustom ?? "").trim(),
          position: String(entry?.position ?? "").trim(),
          name: String(entry?.name ?? entry?.winnerName ?? "").trim(),
        }))
      : [{ participation: "Solo", participationCustom: "", position: "", name: "" }];

    setResultEntries(nextEntries);
  }, [event]);

  const handleBack = () => {
    navigate("/organizer/events");
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

    const whatsappNumber = event?.organizer?.whatsappNumber || event?.organizer?.phone;

    if (whatsappNumber) {
      const message = encodeURIComponent(`Hello, I have a question regarding "${event?.title}".`);
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
    }
  };

  const handleStatusUpdate = async () => {
    if (!eventId || !event || !statusDraft) return;

    if (statusDraft === "completed") {
      setCompletionPreviousStatus(event?.status || "upcoming");
      setCompletionConfirmOpen(true);
      return;
    }

    if (statusDraft === "cancelled" || statusDraft === "postponed") {
      setCompletionConfirmOpen(true);
      return;
    }

    const normalizedReason = (statusReason || "").trim();

    try {
      setUpdatingStatus(true);
      const payload = {
        status: statusDraft,
        statusReason: normalizedReason,
      };

      await updateOrganizerEvent(eventId, payload);
      await refetch();
      toast.success("Event status updated successfully.");
    } catch (updateError) {
      toast.error(updateError?.message || "Unable to update event status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusConfirmation = async ({ isFinalCancel = false } = {}) => {
    if (!eventId || !event || !statusDraft) return;

    const normalizedReason =
      statusDraft === "cancelled" || statusDraft === "postponed"
        ? (statusReason || "").trim()
        : "";

    if ((statusDraft === "cancelled" || statusDraft === "postponed") && !normalizedReason) {
      toast.error("Please add a reason before marking this event as cancelled or postponed.");
      return false;
    }

    try {
      setUpdatingStatus(true);
      const payload = {
        status: statusDraft,
        statusReason: normalizedReason,
      };

      if (isFinalCancel && statusDraft === "cancelled") {
        payload.completionConfirmedAt = new Date().toISOString();
      }

      await updateOrganizerEvent(eventId, payload);
      setCompletionConfirmOpen(false);
      await refetch();
      toast.success(
        isFinalCancel && statusDraft === "cancelled"
          ? "Event final cancellation confirmed successfully."
          : statusDraft === "cancelled"
            ? "Event marked as cancelled successfully."
            : statusDraft === "postponed"
              ? "Event marked as postponed successfully."
              : "Event status updated successfully."
      );
      return true;
    } catch (updateError) {
      toast.error(updateError?.message || "Unable to update event status.");
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompleteEvent = async () => {
    if (!eventId || !event) return;

    try {
      setCompletingEvent(true);
      await completeOrganizerEvent(eventId);
      setCompletionConfirmOpen(false);
      setStatusDraft("completed");
      await refetch();
      toast.success("Event marked as completed successfully.");
    } catch (completeError) {
      setStatusDraft(completionPreviousStatus || event?.status || "upcoming");
      toast.error(completeError?.message || "Unable to complete this event.");
    } finally {
      setCompletingEvent(false);
    }
  };

  const cancelCompletionConfirmation = () => {
    setCompletionConfirmOpen(false);
    setFinalCancelWarningOpen(false);
    setStatusDraft(completionPreviousStatus || event?.status || "upcoming");
  };

  const handleEditEvent = () => {
    if (!eventId || Boolean(event?.completionConfirmedAt)) {
      toast.error("This event cannot be edited anymore.");
      return;
    }
    navigate(`/organizer/events/${eventId}/edit`);
  };

  const handleAddResultEntry = () => {
    setResultEntries((prev) => [...prev, { participation: "Solo", participationCustom: "", position: "", name: "" }]);
  };

  const handleRemoveResultEntry = (index) => {
    setResultEntries((prev) => {
      if (prev.length <= 1) {
        return [{ participation: "Solo", participationCustom: "", position: "", name: "" }];
      }

      return prev.filter((_, entryIndex) => entryIndex !== index);
    });
  };

  const handleResultEntryChange = (index, field, value) => {
    setResultEntries((prev) => prev.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSaveResult = async () => {
    if (!eventId || !event || !isOfficiallyCompleted) {
      toast.error("Results can only be saved after the event is finally confirmed as completed.");
      return;
    }

    const normalizedEntries = resultEntries
      .map((entry) => {
        const participationValue = String(entry?.participation ?? "Solo").trim() || "Solo";
        const resolvedParticipation = participationValue === "Other"
          ? (String(entry?.participationCustom ?? "").trim() || "Other")
          : participationValue;

        return {
          participation: resolvedParticipation,
          position: String(entry?.position ?? "").trim(),
          name: String(entry?.name ?? "").trim(),
        };
      })
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
      await updateOrganizerEvent(eventId, {
        results: normalizedEntries.map((entry) => ({
          participation: entry.participation,
          participationType: entry.participation,
          position: entry.position,
          name: entry.name,
          winnerName: entry.name,
        })),
      });
      await refetch();
      setResultFormOpen(false);
      toast.success("Winner result saved successfully.");
    } catch (saveError) {
      toast.error(saveError?.message || "Unable to save result.");
    } finally {
      setSavingResult(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId || !event) return;

    const confirmed = window.confirm(`Delete "${event.title}"? This action cannot be undone.`);

    if (!confirmed) return;

    try {
      setDeletingEvent(true);
      await deleteOrganizerEvent(eventId);
      toast.success("Event deleted successfully.");
      navigate("/organizer/events");
    } catch (deleteError) {
      toast.error(deleteError?.message || "Unable to delete event.");
    } finally {
      setDeletingEvent(false);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return {
    event,
    loading,
    error,
    isBookmarked,
    toggleBookmark,
    refetch,
    activeTab,
    setActiveTab,
    statusDraft,
    setStatusDraft,
    statusReason,
    setStatusReason,
    updatingStatus,
    deletingEvent,
    handleBack,
    handleShare,
    handleAskQuestion,
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
    isLocked: isFinalCompleted,
    isCompleted,
    isOfficiallyCompleted: isFinalCompleted,
    isFinalCompleted,
    canComplete,
    canFinalizeCompletion,
    completingEvent,
    completionConfirmOpen,
    finalCancelWarningOpen,
    setFinalCancelWarningOpen,
    savingResult,
    resultEntries,
    resultFormOpen,
    setResultFormOpen,
    scrollToSection,
  };
};
