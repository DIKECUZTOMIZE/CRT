import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { deleteOrganizerEvent, updateOrganizerEvent } from "../../Event/api/event.api.js";
import { useOrganizerEventDetails } from "./useOrganizerEventDetails.jsx";

export const useOrganizerEventDetailsPage = (eventId) => {
  const navigate = useNavigate();
  const { event, loading, error, isBookmarked, toggleBookmark, refetch } = useOrganizerEventDetails(eventId);

  const [activeTab, setActiveTab] = useState("overview-section");
  const [statusDraft, setStatusDraft] = useState("upcoming");
  const [statusReason, setStatusReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  useEffect(() => {
    if (event?.status) {
      setStatusDraft(event.status);
      setStatusReason(event.statusReason || "");
    }
  }, [event?.status, event?.statusReason]);

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

    const normalizedReason =
      statusDraft === "cancelled" || statusDraft === "postponed"
        ? (statusReason || "").trim()
        : "";

    if ((statusDraft === "cancelled" || statusDraft === "postponed") && !normalizedReason) {
      toast.error("Please add a reason before marking this event as cancelled or postponed.");
      return;
    }

    try {
      setUpdatingStatus(true);
      await updateOrganizerEvent(eventId, {
        status: statusDraft,
        statusReason: normalizedReason,
      });
      await refetch();
      toast.success("Event status updated successfully.");
    } catch (updateError) {
      toast.error(updateError?.message || "Unable to update event status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEditEvent = () => {
    if (!eventId) return;
    navigate(`/organizer/events/${eventId}/edit`);
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
    handleEditEvent,
    handleDeleteEvent,
    scrollToSection,
  };
};
