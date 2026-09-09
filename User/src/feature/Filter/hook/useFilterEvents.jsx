import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicEvents } from "../api/filter.api.js";

const toNumber = (value) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatMoney = (value) => {
  const amount = toNumber(value);
  if (!amount) return "Free";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const getMinEntryFee = (event) => {
  const entries = Array.isArray(event?.entries) ? event.entries.filter(Boolean) : [];
  const prices = entries
    .map((entry) => toNumber(entry?.price ?? entry?.amount ?? entry?.entryFee))
    .filter((price) => price > 0);

  if (prices.length) return Math.min(...prices);
  return toNumber(event?.entryFee ?? event?.fee ?? event?.minEntryFee ?? 0);
};

const getPrizePool = (event) => {
  const prizePool = toNumber(
    event?.totalPrizePool ?? event?.prizePool ?? event?.prizes?.[0]?.amount ?? 0
  );

  if (prizePool) return prizePool;

  return Array.isArray(event?.prizes)
    ? event.prizes.reduce((sum, prize) => {
        if (!prize || typeof prize !== "object") return sum;

        const prizeAmount = toNumber(prize.amount ?? prize.value ?? 0);
        return sum + prizeAmount;
      }, 0)
    : 0;
};

const normalizeLocationValue = (event = {}) => {
  const allParts = [
    event?.location,
    event?.venueAddress,
    event?.city,
    event?.district,
    event?.state,
    event?.pinCode,
  ]
    .filter((part) => typeof part === "string")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!allParts.length) return "Location TBA";

  const primary = typeof event?.location === "string" ? event.location.trim() : "";
  if (
    primary &&
    (primary.includes(",") || primary.length > 24 || /\d/.test(primary))
  ) {
    return primary;
  }

  const fallbackParts = [...new Set([
    event?.venueAddress,
    event?.city,
    event?.district,
    event?.state,
    event?.pinCode,
    event?.location,
  ].filter((part) => typeof part === "string" && part.trim()))].map((part) => part.trim());

  return fallbackParts.length ? fallbackParts.join(", ") : allParts.join(", ");
};

const normalizePublicEvent = (event) => {
  const id = event?._id || event?.id;
  const organizerName =
    event?.organizerName ||
    event?.organizer?.name ||
    event?.organizerContact?.name ||
    event?.organizerName ||
    "Official Organizer";

  const minEntryFee = getMinEntryFee(event);
  const prizePool = getPrizePool(event);

  return {
    id,
    _id: id,
    title: event?.title || "Untitled Event",
    organizer: organizerName,
    category: event?.category || "General",
    viewsCount: Number(event?.viewsCount ?? event?.viewCount ?? 0),
    type: event?.eventType || event?.competitionType || event?.category || "Competition",
    mode: event?.eventMode || event?.mode || "Offline",
    location: normalizeLocationValue(event),
    banner: event?.bannerUrl || event?.cardImageUrl || event?.image || "",
    date: event?.eventDate || event?.eventStartDate || event?.registrationStart || "TBA",
    status: event?.status || "upcoming",
    entryFee: minEntryFee > 0 ? formatMoney(minEntryFee) : "Free",
    prize: prizePool > 0 ? formatMoney(prizePool) : "No prize pool",
    seatsAvailable: Number(event?.totalSeats ?? event?.seatsAvailable ?? 0),
    participantsCount: Number(event?.participantsCount ?? event?.registeredCount ?? 0),
    tags: Array.isArray(event?.tags) ? event.tags : [],
    raw: event,
  };
};

export const useFilterEvents = (filters = {}) => {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["public-events-filter", JSON.stringify(filters)],
    queryFn: () => getPublicEvents(filters),
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const events = useMemo(
    () => (Array.isArray(data) ? data.map(normalizePublicEvent) : []),
    [data]
  );

  return {
    events,
    isLoading,
    isError,
    error,
  };
};
