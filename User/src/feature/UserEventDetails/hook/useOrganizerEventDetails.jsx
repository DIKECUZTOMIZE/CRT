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
  const entries = Array.isArray(event.entries)
    ? event.entries.filter((entry) =>
        entry &&
        [
          entry.customName,
          entry.category,
          entry.name,
          entry.participationType,
          entry.type,
          entry.price,
          entry.amount,
        ].some((value) => value !== undefined && value !== null && String(value).trim() !== "")
      )
    : [];
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

    const hasPrizeData = [
      prize.category,
      prize.customTitle,
      prize.position,
      prize.reward,
    ].some((value) => typeof value === "string" && value.trim()) ||
      (prize.amount !== undefined &&
        prize.amount !== null &&
        (typeof prize.amount !== "string" || prize.amount.trim() !== ""));
    if (!hasPrizeData) return;

    const categoryName = String(prize.category || "").trim();
    const currentGroup = groupedPrizeMap.get(categoryName) || {
      category: categoryName,
      description: "",
      prizes: [],
      isSoloOnly: /solo|individual|single/i.test(categoryName),
    };

    const normalizedPrize = {
      currency: "INR",
      perks: typeof prize.reward === "string" ? prize.reward : "",
    };
    if (typeof prize.position === "string" && prize.position.trim()) {
      normalizedPrize.rank = prize.position;
    }
    if (typeof prize.customTitle === "string" && prize.customTitle.trim()) {
      normalizedPrize.customTitle = prize.customTitle;
    }
    if (typeof prize.amount === "number" && Number.isFinite(prize.amount)) {
      normalizedPrize.amount = prize.amount;
    }

    currentGroup.prizes.push(normalizedPrize);

    groupedPrizeMap.set(categoryName, currentGroup);
  });

  const prizes = groupedPrizeMap.size > 0
    ? Array.from(groupedPrizeMap.values())
    : [];

  const entryCategories = entries.map((entry, index) => {
    const participationType = entry.participationType || entry.type || "";
    const baseCategory = entry.customName || entry.category || entry.name || "";
    const label = [participationType, baseCategory].filter(Boolean).join(" ");
    const amount = Number(entry.price ?? entry.amount ?? 0);

    const normalizedEntry = {
      id: entry._id || entry.id || `${label}-${index}`,
      label,
      category: entry.category || entry.customName || entry.name || participationType || "",
      name: label,
      currency: "INR",
    };
    const savedAmount = entry.price ?? entry.amount;
    if (savedAmount !== undefined && savedAmount !== null && savedAmount !== "") {
      normalizedEntry.amount = amount;
    }
    if (typeof entry.description === "string" && entry.description.trim()) {
      normalizedEntry.description = entry.description;
    }
    return normalizedEntry;
  });

  const rawEntryFee = event.entryFee || {};
  const directEntryFeeAmount =
    Number(rawEntryFee.amount ?? rawEntryFee.price ?? event.fee ?? event.entryFeeAmount ?? 0) || 0;
  const explicitFree = Boolean(event.isFree || rawEntryFee.isFree);
  const hasEntryFeeValue = (value) =>
    value !== undefined &&
    value !== null &&
    (typeof value !== "string" || value.trim() !== "");
  const rawFeeCategories = Array.isArray(rawEntryFee.categories)
    ? rawEntryFee.categories.filter((category) =>
        category &&
        typeof category === "object" &&
        [
          category.label,
          category.name,
          category.category,
          category.amount,
        ].some((value) => value !== undefined && value !== null && String(value).trim() !== "")
      )
    : [];
  const hasEntryFeeData =
    entries.length > 0 ||
    [rawEntryFee.amount, rawEntryFee.price, event.fee, event.entryFeeAmount]
      .some(hasEntryFeeValue) ||
    rawFeeCategories.length > 0 ||
    event.isFree === true ||
    rawEntryFee.isFree === true;
  const feeEntries = entryCategories.length > 0 ? entryCategories : rawFeeCategories;
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
  } else if (hasTeamConfig && maxTeamSize > 0) {
    competitionDetails.teamSize = `Up to ${maxTeamSize} Members`;
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
  const results = Array.isArray(event.results)
    ? event.results
        .filter((result) => result && typeof (result.winnerName || result.name) === "string" &&
          (result.winnerName || result.name).trim())
        .map((result) => ({
          participationType: result.participationType || result.participation || "",
          position: result.position || "",
          winnerName: result.winnerName || result.name,
        }))
    : [];
  const howToJoin = Array.isArray(event.participationSteps)
    ? event.participationSteps
        .map((step) => ({
          ...(typeof step?.title === "string" && step.title.trim() ? { title: step.title } : {}),
          text: typeof step === "string" ? step : typeof step?.text === "string" ? step.text : "",
        }))
        .filter((step) => step.text.trim())
    : [];
  const terms = Array.isArray(event.eventRules)
    ? event.eventRules
        .map((rule) => typeof rule === "string"
          ? { text: rule }
          : {
              ...(typeof rule?.type === "string" && rule.type.trim() ? { type: rule.type } : {}),
              text: typeof rule?.text === "string" ? rule.text : "",
            })
        .filter((rule) => rule.text.trim())
    : [];
  const securityRequirements = Array.isArray(event.securityRequirements)
    ? event.securityRequirements
        .map((requirement) => ({
          ...(typeof requirement?.type === "string" && requirement.type.trim()
            ? { type: requirement.type }
            : {}),
          text: typeof requirement === "string"
            ? requirement
            : typeof requirement?.text === "string"
              ? requirement.text
              : typeof requirement?.rule === "string"
                ? requirement.rule
                : "",
        }))
        .filter((requirement) => requirement.text.trim())
    : [];
  const customFields = Array.isArray(event.customFields)
    ? event.customFields
        .filter((field) => typeof field?.fieldName === "string" && field.fieldName.trim())
        .map((field) => ({
          fieldName: field.fieldName,
          ...(typeof field.fieldType === "string" ? { fieldType: field.fieldType } : {}),
          ...(typeof field.isRequired === "boolean" ? { isRequired: field.isRequired } : {}),
        }))
    : [];

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
      members: Array.isArray(event.organizerTeam)
        ? event.organizerTeam
            .filter((member) => member && typeof member === "object")
            .map((member) => ({
              name: member.name || "",
              role: member.role || "",
              contact: member.contact || "",
            }))
            .filter((member) => [member.name, member.role, member.contact].some((value) => value.trim()))
        : [],
    },
    meta: {
      status: normalizedStatus,
      statusReason,
      seatsAvailable: event.totalSeats ?? null,
      seatAvailability: event.seatAvailability || "",
      customSeatDetails: event.customSeatDetails || "",
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
      seatsAvailable: event.totalSeats ?? null,
      seatAvailability: event.seatAvailability || "",
      customSeatDetails: event.customSeatDetails || "",
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
    onlineLink: typeof event.onlineLink === "string" ? event.onlineLink.trim() : "",
    competitionDetails,
    prizes,
    results,
    howToJoin,
    terms,
    securityRequirements,
    customFields,
    hasEntryFeeData,
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
