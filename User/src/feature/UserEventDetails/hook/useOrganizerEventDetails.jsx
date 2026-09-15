import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";

import { listenToEventUpdates } from "../../../app/config/socket.js";
import { getOrganizerEventDetails } from "../api/organizerEventDetails.api.js";

const normalizeLocationValue = (
  location,
  venueAddress,
  city,
  district,
  state,
  pinCode,
) => {
  const allParts = [location, venueAddress, city, district, state, pinCode]
    .filter((part) => typeof part === "string")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!allParts.length) return "";

  const primary = typeof location === "string" ? location.trim() : "";
  if (
    primary &&
    (primary.includes(",") || primary.length > 24 || /\d/.test(primary))
  ) {
    return primary;
  }

  const fallbackParts = [...new Set([
    venueAddress,
    city,
    district,
    state,
    pinCode,
    location,
  ].filter((part) => typeof part === "string" && part.trim()))].map((part) => part.trim());

  return fallbackParts.length ? fallbackParts.join(", ") : allParts.join(", ");
};

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

const normalizeEventDetail = (event, currentUserId = null) => {
  if (!event || typeof event !== "object") return null;

  const normalizedStatus = typeof event.status === "string" ? event.status.toLowerCase() : "";
  const organizerContact = event.organizerContact || {};
  const participation = event.participation || {};
  const entries = Array.isArray(event.entries) ? event.entries.filter(Boolean) : [];
  const scheduleEntries = Array.isArray(event.schedules)
    ? event.schedules.filter(Boolean).map((item) => ({
        label: item.customType || item.type || "Schedule",
        date: item?.date || "",
        time: item?.time || "",
      }))
    : [];
  const participationMode = participation.mode || entries[0]?.participationType || "";
  const minTeamSize = Number(participation.minTeamSize || 0) || 0;
  const maxTeamSize = Number(participation.maxTeamSize || 0) || 0;
  const teamMode = participationMode === "Team" || participationMode === "Both";
  const hasTeamConfig = teamMode || minTeamSize > 0 || maxTeamSize > 0;
  const descriptionFallback = {
    tagline: event.tagline || "",
    about: event.description || "",
    whatToPrepare: event.customSeatDetails || "",
    additionalInfo: normalizeLocationValue(
      event.location,
      event.venueAddress,
      event.city,
      event.district,
      event.state,
      event.pinCode,
    ),
  };

  const groupedPrizeMap = new Map();
  (Array.isArray(event.prizes) ? event.prizes : []).forEach((prize) => {
    if (!prize || typeof prize !== "object") return;

    const categoryName = String(prize.category || prize.customTitle || "General").trim() || "General";
    const currentGroup = groupedPrizeMap.get(categoryName) || {
      category: categoryName,
      description: prize.reward || prize.customTitle || "",
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

  const competitionDetails = {};
  const normalizedRatings = Array.isArray(event.ratings)
    ? event.ratings
        .filter((rating) => rating && typeof rating === "object")
        .map((rating) => ({
          userId: rating.userId || rating.user || null,
          value: Number(rating.value ?? rating.rating ?? 0) || 0,
          createdAt: rating.createdAt || null,
        }))
    : [];
  const currentUserRating = normalizedRatings.find(
    (rating) => String(rating.userId) === String(currentUserId)
  )?.value ?? 0;

  if (participationMode) {
    competitionDetails.participationType =
      participationMode === "Both" ? "Solo & Team" : participationMode;
  }

  if (hasTeamConfig && minTeamSize > 0 && maxTeamSize > 0) {
    competitionDetails.teamSize = `${minTeamSize} - ${maxTeamSize} Members`;
  } else if (hasTeamConfig && minTeamSize > 0) {
    competitionDetails.teamSize = `${minTeamSize}+ Members`;
  }

  if (event.category) {
    competitionDetails.category = event.category;
  }

  if (event.eventMode) {
    competitionDetails.mode = event.eventMode;
  }

  if (event.ageGroup) {
    competitionDetails.ageGroup = event.ageGroup;
  }

  if (event.eligibility) {
    competitionDetails.eligibility = event.eligibility;
  }

  if (event.skillLevel) {
    competitionDetails.skillLevel = event.skillLevel;
  }

  if (event.competitionType) {
    competitionDetails.competitionType = event.competitionType;
  }

  const statusReason = typeof event.statusReason === "string"
    ? event.statusReason.trim()
    : "";

  return {
    id: event._id || event.id,
    title: event.title || "",
    status: normalizedStatus,
    statusReason,
    category: event.category || "",
    mode: event.eventMode || "",
    bannerUrl: event.bannerUrl || event.cardImageUrl || "/assets/images/banner-placeholder.png",
    tagline: event.tagline || "",
    description: normalizeDescription(event.description, descriptionFallback),
    organizer: {
      name: organizerContact.name || event.organizerName || "",
      logo: event.organizerLogo || "",
      tagline: event.tagline || organizerContact.tagline || "",
      verified: !!event.organizerContact,
      whatsappNumber: organizerContact.whatsapp || "",
      phone: organizerContact.whatsapp || "",
      email: organizerContact.email || "",
      members: Array.isArray(event.organizerTeam) ? event.organizerTeam.map((member) => ({
        name: member.name || "",
        role: member.role || "",
        image: member.image || "",
      })) : [],
    },
    meta: {
      status: normalizedStatus,
      seatsAvailable: event.totalSeats || 0,
      location: normalizeLocationValue(
        event.location,
        event.venueAddress,
        event.city,
        event.district,
        event.state,
        event.pinCode,
      ),
      startDate: event.eventDate || event.eventStart || "",
      startTime: event?.eventStartTime || event?.eventTime || "",
      endDate: event.eventEndDate || event.eventEnd || "",
      endTime: event?.eventEndTime || event?.eventTime || "",
      registrationStarts: event.registrationStart || "",
      registrationDeadline: event.registrationEnd || "",
      scheduleItems: scheduleEntries,
    },
    overview: {
      status: normalizedStatus,
      seatsAvailable: event.totalSeats || 0,
      location: normalizeLocationValue(
        event.location,
        event.venueAddress,
        event.city,
        event.district,
        event.state,
        event.pinCode,
      ),
      startDate: event.eventDate || event.eventStart || "",
      startTime: event?.eventStartTime || event?.eventTime || "",
      endDate: event.eventEndDate || event.eventEnd || "",
      endTime: event?.eventEndTime || event?.eventTime || "",
      registrationStarts: event.registrationStart || "",
      registrationDeadline: event.registrationEnd || "",
      scheduleItems: scheduleEntries,
    },
    competitionDetails,
    prizes,
    howToJoin: Array.isArray(event.participationSteps) && event.participationSteps.length > 0
      ? event.participationSteps.map((step) => ({ text: step.text || step }))
      : [],
    terms: Array.isArray(event.eventRules) ? event.eventRules.map((rule) => ({ text: rule.text || rule })) : [],
    securityRequirements: Array.isArray(event.securityRequirements)
      ? event.securityRequirements.map((requirement) => ({
          type: requirement.type && requirement.type.trim().length > 0
            ? requirement.type
            : "Security Requirement",
          text: requirement.text || requirement.rule || "",
        }))
      : [],
    entryFee: {
      isFree,
      amount: feeAmount,
      currency: rawEntryFee.currency || "INR",
      categories: feeEntries,
      note: rawEntryFee.note || "",
    },
    fee: feeAmount,
    isFree,
    ratings: normalizedRatings,
    userRating: currentUserRating,
    viewsCount: Number(event.viewsCount ?? event.viewCount ?? 0) || 0,
    avgRating: Number(event.avgRating ?? event.rating ?? 0) || 0,
    ratingsCount: Number(event.ratingsCount ?? event.reviewCount ?? event.ratingCount ?? 0) || 0,
    participationType: participationMode
      ? (participationMode === "Both" ? "Solo & Team" : participationMode)
      : "",
  };
};

export const useOrganizerEventDetails = (eventId) => {
  const authUser = useSelector((state) => state.auth.user);
  const currentUserId = authUser?._id || authUser?.id || null;
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
      setEvent(normalizeEventDetail(eventData, currentUserId));
    } catch (err) {
      setError(err?.message || "Failed to load event details.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, eventId]);

  useEffect(() => {
    if (eventId) {
      fetchDetails();
    } else {
      setLoading(false);
      setError("Event ID is missing.");
      setEvent(null);
    }
  }, [eventId, fetchDetails]);

  useEffect(() => {
    if (!eventId) return undefined;

    const unsubscribe = listenToEventUpdates(eventId, () => {
      fetchDetails();
    });

    return unsubscribe;
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
