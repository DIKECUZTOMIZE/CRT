import apiClient, { API_ENDPOINTS } from "../../../../app/config/axios.js";
import { ImageWithFallback } from "../../shared/ImageWithFallback";
import { StatusBadge } from "../../shared/StatusBadge";
import { SaveButton } from "../../shared/SaveButton";
import {
  CalendarDays,
  Eye,
  MapPin,
  Star,
  Trophy,
  Users,
} from "lucide-react";

const formatCardDate = (value) => {
  if (!value) return "TBA";

  const raw = String(value).trim();
  if (!raw || raw === "TBA") return "TBA";

  if (/^Start:\s/i.test(raw) || /^End:\s/i.test(raw)) {
    return raw.replace(/^Start:\s*/i, "").replace(/^End:\s*/i, "").trim();
  }

  if (raw.includes("•")) {
    return raw
      .split("•")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" • ");
  }

  if (raw.includes("-")) {
    const parts = raw.split("-").map((part) => part.trim()).filter(Boolean);
    const formattedParts = parts.map((dateString) => {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    });

    return formattedParts.slice(0, 2).join(" - ") || "TBA";
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const normalizeRating = (value) => {
  const rating = Number(value ?? 0);

  if (!Number.isFinite(rating) || rating <= 0) return 0;
  return Math.min(Math.max(rating, 0), 5);
};

const FALLBACK_DISPLAY_VALUES = new Set([
  "competition",
  "untitled event",
  "tba",
  "location tba",
  "no prize pool",
  "free",
  "sold out",
  "available",
  "limited seats",
  "open registration",
  "not available",
  "general",
  "unknown",
  "n/a",
  "na",
  "0",
  "0.0",
]);

const isMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return !FALLBACK_DISPLAY_VALUES.has(trimmed.toLowerCase());
  }

  return Boolean(value);
};

const normalizeAmount = (value) => {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return value === 0 ? "Free" : `₹${value.toLocaleString("en-IN")}`;
  }

  const trimmed = String(value).trim();
  if (!trimmed) return "";

  const lowered = trimmed.toLowerCase();
  if (lowered === "free") return "Free";
  if (lowered === "0" || lowered === "0.0" || lowered === "0.00") return "Free";

  if (trimmed.startsWith("₹")) return trimmed;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const numericValue = Number(trimmed);
    return numericValue === 0 ? "Free" : `₹${numericValue.toLocaleString("en-IN")}`;
  }

  return trimmed;
};

const getFeeChipText = (value) => {
  const normalized = normalizeAmount(value);
  if (!normalized || normalized === "Free") return "Free";
  return "Paid";
};

const isDisplayableFeeValue = (value) => {
  if (value === null || value === undefined || value === "") return false;

  const trimmed = String(value).trim();
  if (!trimmed) return false;

  const lowered = trimmed.toLowerCase();
  if (lowered === "free") return true;
  if (lowered === "0" || lowered === "0.0" || lowered === "0.00") return true;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed) >= 0;

  return !FALLBACK_DISPLAY_VALUES.has(lowered);
};

const normalizePrizeDisplay = (value) => {
  if (value === null || value === undefined || value === "") return "No prize pool";

  const trimmed = String(value).trim();
  if (!trimmed) return "No prize pool";

  const normalized = trimmed.toLowerCase();
  const placeholderValues = [
    "tba",
    "to be announced",
    "to be updated",
    "not announced",
    "not announced yet",
    "prize tba",
    "prize pool",
    "na",
    "n/a",
    "unknown",
  ];

  if (placeholderValues.includes(normalized)) return "No prize pool";

  return trimmed;
};

const formatCompactMetric = (value) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) return "0";
  if (numericValue >= 1000000) return `${(numericValue / 1000000).toFixed(1)}M`;
  if (numericValue >= 1000) return `${(numericValue / 1000).toFixed(numericValue >= 10000 ? 0 : 1)}K`;
  return String(numericValue);
};

const splitLocationParts = (value) => {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
};

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

  if (!allParts.length) return { short: "Location TBA", full: "Location TBA" };

  const fullParts = [...new Set(
    [location, venueAddress, city, district, state, pinCode]
      .flatMap((part) => splitLocationParts(part))
      .filter(Boolean),
  )];

  const fullLocation = fullParts.length ? fullParts.join(", ") : allParts.join(", ");
  const shortLocation = fullParts.length > 2 ? fullParts.slice(0, 2).join(", ") : fullLocation;

  return {
    short: shortLocation || "Location TBA",
    full: fullLocation || "Location TBA",
  };
};

const getSeatAvailabilityText = (item) => {
  const seatAvailability = String(item?.seatAvailability || item?.seat_status || "").trim();
  const totalSeats = Number(item?.totalSeats ?? item?.seatsAvailable ?? item?.availableSeats ?? 0);
  const customSeatDetails = item?.customSeatDetails;
  const directSeats = Number(item?.seatsAvailable ?? item?.availableSeats ?? NaN);

  if (seatAvailability.toLowerCase() === "not available") {
    return "Sold out";
  }

  if (seatAvailability.toLowerCase() === "other" && customSeatDetails) {
    return customSeatDetails;
  }

  if (Number.isFinite(directSeats) && directSeats > 0) {
    return `${directSeats} seats left`;
  }

  if (Number.isFinite(totalSeats) && totalSeats > 0) {
    return `${totalSeats} seats left`;
  }

  if (seatAvailability.toLowerCase() === "available") {
    return "Limited seats";
  }

  return "Open registration";
};

export const CompetitionCard = ({
  item,
  isSaved = false,
  onToggleSave,
  onClick,
}) => {
  const eventId = item?.id ?? item?._id;
  const mediaSrc = item?.banner || item?.bannerUrl || item?.cardImageUrl;
  const hasMedia = Boolean(mediaSrc && String(mediaSrc).trim());
  const hasTitle = isMeaningfulValue(item?.title) && !FALLBACK_DISPLAY_VALUES.has(String(item?.title).trim().toLowerCase());
  const hasCategory = isMeaningfulValue(item?.category) && !FALLBACK_DISPLAY_VALUES.has(String(item?.category).trim().toLowerCase());
  const rawRatingValue = item?.rating ?? item?.avgRating ?? item?.ratingScore;
  const ratingValue = rawRatingValue === null || rawRatingValue === undefined || rawRatingValue === "" ? 0 : normalizeRating(rawRatingValue);
  const reviewCount = Number(item?.reviewsCount ?? item?.reviewCount ?? item?.ratingCount ?? 0) || 0;
  const hasRating = rawRatingValue !== null && rawRatingValue !== undefined && rawRatingValue !== "" && Number.isFinite(Number(rawRatingValue)) && Number(rawRatingValue) > 0;
  const dateSource = item?.date ?? item?.eventDate ?? item?.eventStart ?? item?.registrationStart;
  const hasDate = isMeaningfulValue(dateSource) && !FALLBACK_DISPLAY_VALUES.has(String(dateSource).trim().toLowerCase());
  const locationParts = [item?.location, item?.venueAddress, item?.city, item?.district, item?.state, item?.pinCode];
  const hasLocation = locationParts.some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return isMeaningfulValue(value);
    return Boolean(value);
  });
  const locationValue = hasLocation ? normalizeLocationValue(
    item?.location,
    item?.venueAddress,
    item?.city,
    item?.district,
    item?.state,
    item?.pinCode,
  ) : { short: "", full: "" };
  const displayLocation = isMeaningfulValue(locationValue.short) ? locationValue.short : "";
  const fullLocation = isMeaningfulValue(locationValue.full) ? locationValue.full : "";
  const displayDate = hasDate ? formatCardDate(dateSource) : "";
  const seatAvailabilitySource = item?.seatAvailability ?? item?.seat_status ?? item?.customSeatDetails ?? item?.totalSeats ?? item?.seatsAvailable ?? item?.availableSeats;
  const hasSeatStatus = isMeaningfulValue(seatAvailabilitySource) && !FALLBACK_DISPLAY_VALUES.has(String(seatAvailabilitySource).trim().toLowerCase());
  const seatAvailabilityText = hasSeatStatus ? getSeatAvailabilityText(item) : "";
  const prizeSource = item?.prize ?? item?.prizePool ?? item?.totalPrizePool;
  const hasPrize = isMeaningfulValue(prizeSource) && !FALLBACK_DISPLAY_VALUES.has(String(prizeSource).trim().toLowerCase());
  const prizeLabel = hasPrize ? normalizePrizeDisplay(prizeSource) : "";
  const entryFeeValue = item?.entryFee ?? item?.fee ?? item?.entry;
  const hasEntryFee = isDisplayableFeeValue(entryFeeValue);
  const rawViewCount = item?.viewsCount ?? item?.viewCount ?? item?.impressions ?? item?.participantsCount ?? item?.registeredCount;
  const viewCount = Number(rawViewCount ?? 0);
  const hasViews = rawViewCount !== null && rawViewCount !== undefined && rawViewCount !== "" && Number.isFinite(viewCount) && viewCount >= 0;
  // const joinedCount = Number(item?.participantsCount ?? item?.registeredCount ?? item?.attendees ?? 0) || 0;

  const handleCardClick = () => {
    onClick?.(item);
  };

  const normalizedStatus = typeof item?.status === "string" ? item.status.trim().toLowerCase() : "";
  const hasStatus = Boolean(normalizedStatus) && !FALLBACK_DISPLAY_VALUES.has(normalizedStatus);

  const handleSave = (e) => {
    e.stopPropagation();
    onToggleSave?.(eventId);
  };

  const handleViewClick = async (e) => {
    e.stopPropagation();

    if (eventId) {
      try {
        await apiClient.post(`${API_ENDPOINTS.publicEvents}/${eventId}/view`);
      } catch (error) {
        console.warn("Failed to register event view:", error);
      }
    }

    onClick?.(item);
  };

  const mediaRatingBadge = hasRating ? (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/85 px-1.5 py-0.5 text-[9px] font-semibold text-slate-800 shadow-[0_4px_10px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:text-[10px]">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400 sm:h-3.5 sm:w-3.5" />
      <span>{ratingValue.toFixed(1)}</span>
      {reviewCount > 0 && <span className="text-slate-500">({reviewCount})</span>}
    </div>
  ) : null;

  const mediaTopControls = (
    <div className="absolute inset-x-2.5 top-2.5 z-20 flex items-center justify-between gap-2 sm:inset-x-3 sm:top-3">
      {hasStatus ? (
        <div className="relative z-10 -translate-y-[1px]">
          <StatusBadge status={item?.status} />
        </div>
      ) : (
        <div className="h-6 w-12 rounded-full bg-white/10 backdrop-blur-sm" />
      )}

      <div className="relative z-10 -translate-y-[1px]">
        <SaveButton
          size="sm"
          isSaved={isSaved}
          onToggle={handleSave}
          className="border border-white/20 bg-slate-950/30 text-white backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
        />
      </div>
    </div>
  );

  const mediaViewCountBadge = hasViews ? (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/55 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-[0_4px_10px_rgba(15,23,42,0.14)] backdrop-blur-sm sm:text-[10px]">
      <Eye className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
      <span>{formatCompactMetric(viewCount)}</span>
    </div>
  ) : null;

  return (
    <article
      onClick={handleCardClick}
      className="
        group relative w-full min-w-0 max-w-full cursor-pointer overflow-hidden
        rounded-[1.15rem] border border-slate-200/80 bg-white/95
        shadow-[0_10px_24px_rgba(15,23,42,0.06)]
        transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]
        active:scale-[0.99]
        sm:rounded-[1.35rem]
        [word-break:break-word]
      "
    >
      {hasMedia ? (
        <div className="relative overflow-hidden rounded-t-[1.25rem] sm:rounded-t-[1.5rem]">
          <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
            <ImageWithFallback
              src={mediaSrc}
              alt="Competition banner"
              aspectRatio="aspect-[16/10]"
              loading="eager"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
            {mediaTopControls}

            {(hasRating || hasViews) && (
              <div className="absolute inset-x-2.5 bottom-2.5 z-20 flex items-center justify-between gap-2 sm:inset-x-3 sm:bottom-3">
                {mediaRatingBadge}
                {mediaViewCountBadge}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-t-[1.25rem] sm:rounded-t-[1.5rem]">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 sm:aspect-[16/9]">
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.15),rgba(255,255,255,0.55),rgba(255,255,255,0.15))] bg-[length:220%_100%] animate-[pulse_1.8s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-slate-950/5 to-transparent" />
            {mediaTopControls}

            {(hasRating || hasViews) && (
              <div className="absolute inset-x-2.5 bottom-2.5 z-20 flex items-center justify-between gap-2 sm:inset-x-3 sm:bottom-3">
                {mediaRatingBadge}
                {mediaViewCountBadge}
              </div>
            )}

            <div className="absolute inset-x-3 bottom-3 h-2.5 rounded-full bg-white/55" />
            <div className="absolute left-3 top-3 h-2.5 w-12 rounded-full bg-white/55" />
          </div>
        </div>
      )}

      <div className="relative flex min-w-0 flex-col gap-1.5 p-2 pb-3 sm:gap-2 sm:p-2.5 sm:pb-2.5">
        <div className="min-w-0 space-y-1">
          {hasTitle && (
            <div className="min-w-0">
              <h3 className="min-w-0 line-clamp-2 break-words text-[11px] font-semibold leading-[1.35] text-slate-900 sm:text-[13px]">
                {item.title}
              </h3>
            </div>
          )}

          {hasCategory && (
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-700 sm:text-[10px]">
                {item.category}
              </span>
            </div>
          )}
        </div>

        {(hasDate || hasLocation || hasSeatStatus) && (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] text-slate-500 sm:text-[11px]">
            {hasDate && (
              <span className="inline-flex min-w-0 -translate-y-[1px] items-center gap-1 rounded-md bg-slate-50 px-1 py-0.5 text-slate-600">
                <CalendarDays className="h-3 w-3 shrink-0 text-emerald-600" />
                <span className="truncate">{displayDate}</span>
              </span>
            )}
            {hasLocation && (
              <span className="inline-flex min-w-0 -translate-y-[1px] items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-slate-600">
                <MapPin className="h-3 w-3 shrink-0 text-emerald-600" />
                <span title={fullLocation} className="max-w-[9rem] truncate">{displayLocation}</span>
              </span>
            )}
            {hasSeatStatus && (
              <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-slate-600">
                <Users className="h-3 w-3 shrink-0 text-emerald-600" />
                <span className="truncate">{seatAvailabilityText}</span>
              </span>
            )}
          </div>
        )}

        {(hasPrize) && (
          <div className="flex min-w-0 items-end justify-between gap-2 border-t border-slate-100 pt-1.5">
            <div className="min-w-0 space-y-0.5">
              {hasPrize && (
                <div className="min-w-0 text-[9px] font-medium uppercase tracking-[0.08em] text-slate-500 sm:text-[10px]">
                  Prize
                </div>
              )}
              {hasPrize && (
                <div className="min-w-0 break-words text-[12px] font-bold text-emerald-700 sm:text-[13px]">
                  {prizeLabel}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative z-20 mt-0.5 flex w-full flex-nowrap items-center justify-between gap-2 pb-1 sm:hidden">
          <button
            type="button"
            onClick={handleViewClick}
            className="inline-flex min-h-[1.6rem] flex-shrink-0 items-center justify-center gap-0.5 self-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-1.5 py-0.75 text-[8px] font-bold text-white shadow-[0_8px_16px_rgba(16,185,129,0.22)] ring-1 ring-emerald-600/30 transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.99]"
          >
            <span className="text-[9px]">View Details</span> <span aria-hidden="true" className="text-[9px]">→</span>
          </button>

          <div className="ml-auto inline-flex shrink-0 items-center gap-1.5">
            {hasEntryFee && (
              <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.75 text-[9px] font-bold text-slate-800 shadow-[0_2px_6px_rgba(15,23,42,0.08)]">
                <span className="text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-500">Entry</span>
                <span className={normalizeAmount(entryFeeValue) === "Free" ? "text-emerald-600" : "text-slate-800"}>
                  {getFeeChipText(entryFeeValue)}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleViewClick}
          className="mt-0.5 hidden min-h-[1.8rem] items-center justify-center gap-1 self-start rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-2.5 py-1 text-[8.5px] font-semibold text-white shadow-[0_10px_20px_rgba(16,185,129,0.22)] transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.99] sm:inline-flex sm:min-h-[1.9rem] sm:text-[9.5px]"
        >
          View Details <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
};

export default CompetitionCard;