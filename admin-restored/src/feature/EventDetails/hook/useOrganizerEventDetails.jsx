import { useState, useEffect, useCallback } from "react";

import { getOrganizerEventDetails } from "../api/organizerEventDetails.api.js";

const normalizeDescription = (description, fallback) => {
  if (!description) {
    return fallback || "";
  }

  if (typeof description === "string") {
    return description.trim() ? description : fallback || "";
  }

  if (typeof description === "object" && !Array.isArray(description)) {
    const objectFallback = fallback || {};

    return {
      whatIsThis: description.whatIsThis || description.tagline || objectFallback.tagline || "",
      about: description.about || description.description || description.summary || description.text || objectFallback.about || "",
      whatToPrepare: description.whatToPrepare || description.prepare || description.customSeatDetails || objectFallback.whatToPrepare || "",
      additionalInfo: description.additionalInfo || description.venueAddress || objectFallback.additionalInfo || "",
    };
  }

  return fallback || "";
};

const normalizeEventDetail = (event) => {
  if (!event || typeof event !== "object") return null;

  const normalizedStatus = (event.status || "upcoming").toLowerCase();
  const organizerContact = event.organizerContact || {};
  const participation = event.participation || {};
  const entries = Array.isArray(event.entries) ? event.entries.filter(Boolean) : [];
  const scheduleEntries = Array.isArray(event.schedules)
    ? event.schedules.filter(Boolean).map((item) => ({
        label: item.customType || item.type || "Schedule",
        date: item.date || "",
        time: item.time || "",
      }))
    : [];
  const participationMode = participation.mode || entries[0]?.participationType || "Solo";
  const minTeamSize = Number(participation.minTeamSize || 0) || 0;
  const maxTeamSize = Number(participation.maxTeamSize || 0) || 0;
  const teamMode = participationMode === "Team" || participationMode === "Both";
  const hasTeamConfig = teamMode || minTeamSize > 0 || maxTeamSize > 0;
  const descriptionFallback = {
    tagline: event.tagline || "",
    about: event.description || "",
    whatToPrepare: event.customSeatDetails || "",
    additionalInfo: event.venueAddress || event.location || "",
  };

  const groupedPrizeMap = new Map();
  (Array.isArray(event.prizes) ? event.prizes : []).forEach((prize) => {
    if (!prize || typeof prize !== "object") return;

    const categoryName = String(prize.category || "General").trim() || "General";
    const currentGroup = groupedPrizeMap.get(categoryName) || {
      category: categoryName,
      description: prize.reward || "",
      prizes: [],
      isSoloOnly: /solo|individual|single/i.test(categoryName),
    };

    currentGroup.prizes.push({
      rank: prize.position || "Prize",
      customTitle: prize.customTitle || prize.title || prize.name || "",
      amount: Number(prize.amount || 0),
      currency: "INR",
      perks: prize.reward || "",
      note: prize.reward || "",
    });

    groupedPrizeMap.set(categoryName, currentGroup);
  });

  const prizes = groupedPrizeMap.size > 0
    ? Array.from(groupedPrizeMap.values())
    : [];

  const entryCategories = entries.map((entry, index) => {
    const participationType = entry.participationType || entry.type || "";
    const baseCategory = entry.customName || entry.category || entry.name || "Entry";
    const label = participationType
      ? `${participationType} ${baseCategory === "Entry" ? "Entry" : baseCategory}`
      : baseCategory;
    const amount = Number(entry.price ?? entry.amount ?? 0);

    return {
      id: entry._id || entry.id || `${label}-${index}`,
      label,
      category: participationType || entry.category || entry.participationType || label,
      name: label,
      amount,
      currency: "INR",
      description: participationType
        ? `${participationType} participation fee`
        : entry.category
          ? `${entry.category} fee`
          : "Participation fee",
      isPopular: false,
    };
  });

  const rawEntryFee = event.entryFee || {};
  const directEntryFeeAmount =
    Number(rawEntryFee.amount ?? rawEntryFee.price ?? event.fee ?? event.entryFeeAmount ?? 0) || 0;
  const explicitFree = Boolean(event.isFree || rawEntryFee.isFree);
  const feeEntries = entryCategories.length > 0 ? entryCategories :
    (Array.isArray(rawEntryFee.categories) ? rawEntryFee.categories.filter(Boolean) : []);
  const feeAmount = feeEntries.length > 0 ? Number(feeEntries[0]?.amount ?? directEntryFeeAmount ?? 0) : directEntryFeeAmount;
  const isFree = explicitFree || (feeEntries.length === 0 && feeAmount === 0 && !rawEntryFee.categories?.length)
    || (feeEntries.length > 0 && feeEntries.every((entry) => Number(entry.amount || 0) === 0));
  const locationParts = [event.city, event.district, event.state, event.pinCode].filter((part) => typeof part === "string" && part.trim().length > 0);
  const locationText = [event.location, ...locationParts].filter(Boolean).join(", ") || "TBA";

  const rulesSource = Array.isArray(event.eventRules)
    ? event.eventRules
    : Array.isArray(event.rules)
      ? event.rules
      : [];
  const securitySource = Array.isArray(event.securityRequirements)
    ? event.securityRequirements
    : Array.isArray(event.security)
      ? event.security
      : [];

  return {
    id: event._id || event.id,
    title: event.title || "Untitled Event",
    status: normalizedStatus,
    statusReason: event.statusReason || "",
    category: event.category || "General",
    mode: event.eventMode || "Offline",
    viewsCount: Number(event.viewsCount ?? event.viewCount ?? 0) || 0,
    avgRating: Number(event.avgRating ?? event.rating ?? 0) || 0,
    ratingsCount: Number(event.ratingsCount ?? event.reviewCount ?? event.ratingCount ?? 0) || 0,
    bannerUrl: event.bannerUrl || event.cardImageUrl || "/assets/images/banner-placeholder.png",
    tagline: event.tagline || "",
    description: normalizeDescription(event.description, descriptionFallback),
    organizer: {
      name: organizerContact.name || "Official Organizer",
      logo: event.organizerLogo || "",
      tagline: event.tagline || "Official Host",
      verified: !!event.organizerContact,
      whatsappNumber: organizerContact.whatsapp || "",
      phone: organizerContact.whatsapp || "",
      email: organizerContact.email || "",
      members: Array.isArray(event.organizerTeam) ? event.organizerTeam.map((member) => ({
        name: member.name || "Team Member",
        role: member.role || "Organizer Team",
        image: member.image || "",
      })) : [],
    },
    meta: {
      status: normalizedStatus,
      statusReason: event.statusReason || "",
      seatsAvailable: event.totalSeats || 0,
      location: locationText,
      startDate: event.eventDate || event.eventStart || "",
      startTime: event.eventStartTime || event.eventTime || "",
      endDate: event.eventEndDate || event.eventEnd || "",
      endTime: event.eventEndTime || event.eventTime || "",
      registrationStarts: event.registrationStart || "",
      registrationDeadline: event.registrationEnd || "",
      scheduleItems: scheduleEntries,
    },
    overview: {
      status: normalizedStatus,
      statusReason: event.statusReason || "",
      seatsAvailable: event.totalSeats || 0,
      location: locationText,
      startDate: event.eventDate || event.eventStart || "",
      startTime: event.eventStartTime || event.eventTime || "",
      endDate: event.eventEndDate || event.eventEnd || "",
      endTime: event.eventEndTime || event.eventTime || "",
      registrationStarts: event.registrationStart || "",
      registrationDeadline: event.registrationEnd || "",
      scheduleItems: scheduleEntries,
    },
    competitionDetails: {
      participationType:
        participationMode === "Both"
          ? "Solo & Team"
          : participationMode || "Solo",
      teamSize:
        hasTeamConfig && minTeamSize > 0 && maxTeamSize > 0
          ? `${minTeamSize} - ${maxTeamSize} Members`
          : hasTeamConfig && minTeamSize > 0
            ? `${minTeamSize}+ Members`
            : participationMode === "Solo"
              ? "1 Member"
              : "Team Format",
      ageGroup: "18+",
      eligibility: "Open to all eligible participants",
      category: event.category || "General",
      skillLevel: "All Levels",
      competitionType: event.category || "Competition",
      mode: event.eventMode || "Offline",
    },
    prizes,
    howToJoin: Array.isArray(event.participationSteps) && event.participationSteps.length > 0
      ? event.participationSteps.map((step) => ({ text: step.text || step }))
      : [
          "Contact the organizer for event details and participation confirmation.",
          "Confirm your eligibility and participation mode with the organizer.",
          "Complete the registration process as instructed by the organizer.",
        ],
    terms: rulesSource.map((rule) => ({
      type: rule?.type || "Rule",
      text: rule?.text || rule?.rule || rule || "",
    })),
    securityRequirements: securitySource.map((requirement) => ({
      type: requirement?.type && requirement.type.trim().length > 0
        ? requirement.type
        : "Security Requirement",
      text: requirement?.text || requirement?.rule || requirement || "",
    })),
    entryFee: {
      isFree,
      amount: feeAmount,
      currency: rawEntryFee.currency || "INR",
      categories: feeEntries,
      note: rawEntryFee.note || (feeEntries.length > 1 ? "Fee varies by participation category." : "Fee may vary by participation category."),
    },
    fee: feeAmount,
    isFree,
    participationType:
      participationMode === "Both"
        ? "Solo & Team"
        : participationMode || "Solo",
  };
};

export const useOrganizerEventDetails = (eventId) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!eventId) {
        throw new Error("Event ID is missing.");
      }

      const eventData = await getOrganizerEventDetails(eventId);
      setEvent(normalizeEventDetail(eventData));
    } catch (err) {
      setError(err?.message || "Failed to load event details.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchDetails();
    } else {
      setLoading(false);
      setError("Event ID is missing.");
      setEvent(null);
    }
  }, [eventId, fetchDetails]);

  const toggleBookmark = () => {
    setIsBookmarked((prev) => !prev);
  };

  return {
    event,
    loading,
    error,
    isBookmarked,
    toggleBookmark,
    refetch: fetchDetails,
  };
};
