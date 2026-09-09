import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";
import { buildEventSeo } from "../../../app/seo/seoConfig.js";
import { applySeoMeta } from "../../../app/seo/seoUtils.js";
import { useOrganizerEventDetails } from "./useOrganizerEventDetails.jsx";

export const EVENT_TABS = [
  { id: "overview-section", label: "Overview" },
  { id: "prizes-section", label: "Prizes" },
  { id: "how-to-join-section", label: "How To Join" },
  { id: "rules-section", label: "Rules" },
  { id: "organizer-section", label: "Organizer" },
];

export const useUserEventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(user);

  const { event, loading, error, isBookmarked, toggleBookmark, refetch } = useOrganizerEventDetails(id);
  const [activeTab, setActiveTab] = useState("overview-section");

  useEffect(() => {
    if (!event) return;

    const seo = buildEventSeo(event, window.location.pathname);
    applySeoMeta(seo);

    const eventDate = event.meta?.startDate || event.startDate || event.eventDate || "";
    const eventStartTime = event.meta?.startTime || event.startTime || event.eventStartTime || "09:00";
    const eventEndDate = event.meta?.endDate || event.endDate || event.eventEndDate || eventDate;
    const eventEndTime = event.meta?.endTime || event.endTime || event.eventEndTime || "18:00";
    const locationText = event.meta?.location || event.location || event.venueAddress || "";
    const organizerName = event.organizer?.name || "CRT";
    const imageUrl = event.bannerUrl || seo.image;
    const canonicalUrl = seo.canonical;

    const buildSafeDateTime = (dateValue, timeValue) => {
      const safeDateValue = String(dateValue || "").trim();
      if (!safeDateValue || /^(tba|n\/a|na|undefined|null)$/i.test(safeDateValue)) {
        return null;
      }

      const safeTimeValue = String(timeValue || "00:00").trim();
      const dateTimeCandidate = /^\d{1,2}:\d{2}/.test(safeTimeValue)
        ? `${safeDateValue}T${safeTimeValue}:00`
        : safeDateValue;

      const parsedDate = new Date(dateTimeCandidate);
      return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
    };

    const startDateTime = buildSafeDateTime(eventDate, eventStartTime);
    const endDateTime = buildSafeDateTime(eventEndDate, eventEndTime);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: seo.description,
      image: imageUrl,
      url: canonicalUrl,
      startDate: startDateTime ? startDateTime.toISOString() : undefined,
      endDate: endDateTime ? endDateTime.toISOString() : undefined,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: locationText || "CRT Event Venue",
        address: {
          "@type": "PostalAddress",
          addressLocality: event.city || "",
          addressRegion: event.state || "",
          streetAddress: event.venueAddress || locationText || "",
        },
      },
      organizer: {
        "@type": "Organization",
        name: organizerName,
        url: "https://yourdomain.com",
      },
    };

    const existingScript = document.head.querySelector('script[data-seo-event="true"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-event", "true");
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

  }, [event]);

  const handleBack = () => {
    navigate(-1);
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
      toast.error("Unable to share this link right now.");
    }
  };

  const handleAskQuestion = () => {
    const contactSection = document.getElementById("contact-section");

    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const whatsappNumber = event?.organizer?.whatsappNumber || event?.organizer?.phone;

    if (whatsappNumber) {
      const message = encodeURIComponent(`Hello, I have a question regarding "${event?.title}".`);
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
    }
  };

  const handleRateEvent = async (ratingValue) => {
    if (!event?.id) {
      throw new Error("Event not available for rating.");
    }

    try {
      await apiClient.post(`${API_ENDPOINTS.publicEvents}/${event.id}/rate`, {
        rating: Number(ratingValue),
      });

      await refetch();
    } catch (error) {
      throw normalizeError(error);
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
    id,
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
    scrollToSection,
    EVENT_TABS,
    navigate,
  };
};

export default useUserEventDetailsPage;
