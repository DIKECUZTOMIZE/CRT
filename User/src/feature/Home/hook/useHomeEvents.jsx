import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getPublicEvents } from "../api/home.api.js";

const isKnownBrokenUploadUrl = (value) => {
  if (!value) return false;

  const normalized = String(value).trim();
  return /(?:^|\/)(?:uploads\/)?(?:banner_|test-banner-)[^\s"'<>]+\.(?:avif|jpg|jpeg|png|webp|gif)/i.test(normalized);
};

const getMinEntryFee = (event) => {
  const entries = Array.isArray(event?.entries) ? event.entries.filter(Boolean) : [];
  const prices = entries
    .map((entry) => Number(entry?.price ?? 0))
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length ? Math.min(...prices) : 0;
};

const getPrizePool = (event) => Number(event?.totalPrizePool ?? 0) || 0;

const formatDateText = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
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

const normalizeHomeEvent = (event) => {
  const startValue =
    event?.eventDate ||
    event?.eventStartDate ||
    event?.startDate ||
    event?.eventStart ||
    event?.start ||
    event?.registrationStart;

  const endValue =
    event?.eventEndDate ||
    event?.endDate ||
    event?.eventEnd ||
    event?.end ||
    event?.registrationEnd;

  const startedOn = formatDateText(startValue);
  const endsOn = formatDateText(endValue);

  let dateText = "TBA";

  if (startedOn && endsOn && startedOn !== endsOn) {
    dateText = `Start: ${startedOn} • End: ${endsOn}`;
  } else if (startedOn) {
    dateText = `Start: ${startedOn}`;
  } else if (endsOn) {
    dateText = `End: ${endsOn}`;
  }

  const bannerSource = event?.bannerUrl || event?.cardImageUrl || event?.image || "";

  return {
    ...event,
    id: event?._id || event?.id,
    organizer: event?.organizer?.name || event?.organizerContact?.name || event?.organizerName || "Official Organizer",
    category: event?.category || "General",
    location: normalizeLocationValue(event),
    banner: isKnownBrokenUploadUrl(bannerSource) ? "" : bannerSource,
    entryFee: getMinEntryFee(event),
    prizePool: getPrizePool(event),
    date: dateText,
    dateStart: startedOn || null,
    dateEnd: endsOn || null,
  };
};

export const useHomeEvents = (searchQuery = "", selectedCategory = "all") => {
  const currentLocation = useSelector((state) => state.location);

  const locationFilters = useMemo(() => {
    const state = currentLocation?.state && currentLocation.state !== "India" ? currentLocation.state : undefined;
    const city = currentLocation?.city && currentLocation.city !== "All India" ? currentLocation.city : undefined;

    return { state, city };
  }, [currentLocation?.state, currentLocation?.city]);

  const normalizedSearch = String(searchQuery ?? "").trim();
  const normalizedCategory = String(selectedCategory ?? "all").trim();

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [
      "public-events-home",
      locationFilters.state || "all",
      locationFilters.city || "all",
      normalizedCategory,
      normalizedSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      getPublicEvents(
        {
          ...locationFilters,
          search: normalizedSearch,
          category: normalizedCategory === "all" ? undefined : normalizedCategory,
        },
        { page: pageParam, limit: 8 }
      ),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage?.page) || 1;
      const totalPages = Number(lastPage?.totalPages) || 1;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 3 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const events = useMemo(
    () => (Array.isArray(data?.pages) ? data.pages.flatMap((page) => Array.isArray(page?.events) ? page.events : []).map(normalizeHomeEvent) : []),
    [data]
  );

  return {
    events,
    total: Number(data?.pages?.[0]?.total) || 0,
    page: Number(data?.pages?.[data.pages.length - 1]?.page) || 1,
    totalPages: Number(data?.pages?.[0]?.totalPages) || 1,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    isError,
    error,
  };
};
