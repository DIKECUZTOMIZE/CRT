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

const normalizeAmount = (value) => {
  if (value === null || value === undefined || value === "") return "Free";

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return "Free";
    return `₹${value.toLocaleString("en-IN")}`;
  }

  const trimmed = String(value).trim();
  if (!trimmed || trimmed.toLowerCase() === "free") return "Free";

  if (trimmed.startsWith("₹")) return trimmed;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return `₹${Number(trimmed).toLocaleString("en-IN")}`;
  }

  return trimmed;
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
  const ratingValue = normalizeRating(item?.rating ?? item?.avgRating ?? item?.ratingScore ?? 0);
  const reviewCount = Number(item?.reviewsCount ?? item?.reviewCount ?? item?.ratingCount ?? 0) || 0;
  const locationValue = normalizeLocationValue(
    item?.location,
    item?.venueAddress,
    item?.city,
    item?.district,
    item?.state,
    item?.pinCode,
  );
  const displayLocation = locationValue.short;
  const fullLocation = locationValue.full;
  const displayDate = formatCardDate(item?.date ?? item?.eventDate ?? item?.eventStart ?? item?.registrationStart ?? "TBA");
  const seatAvailabilityText = getSeatAvailabilityText(item);
  const prizeLabel = normalizePrizeDisplay(item?.prize ?? item?.prizePool ?? item?.totalPrizePool);
  const viewCount = Number(item?.viewsCount ?? item?.viewCount ?? item?.impressions ?? item?.participantsCount ?? item?.registeredCount ?? 0) || 0;
  // const joinedCount = Number(item?.participantsCount ?? item?.registeredCount ?? item?.attendees ?? 0) || 0;

  const handleCardClick = () => {
    onClick?.(item);
  };

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

  return (
    <article
      onClick={handleCardClick}
      className="
        group relative w-full min-w-0 max-w-full cursor-pointer overflow-hidden
        rounded-[1.25rem] border border-slate-800/80 bg-slate-900/80
        shadow-[0_18px_40px_rgba(2,6,23,0.32)] backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:border-emerald-400/60 hover:shadow-[0_22px_60px_rgba(16,185,129,0.12)]
        sm:rounded-[1.5rem] sm:hover:-translate-y-1
        [word-break:break-word]
      "
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/0 to-slate-950/70" />

      <div className="relative overflow-hidden rounded-t-[1.25rem] sm:rounded-t-[1.5rem]">
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          <ImageWithFallback
            src={item?.banner || item?.bannerUrl || item?.cardImageUrl}
            alt="Competition banner"
            aspectRatio="aspect-[16/10]"
            loading="eager"
            fallbackSrc="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80"
            className="scale-105 transition-transform duration-500 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-transparent" />

          <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-2 sm:left-3 sm:top-3">
            <StatusBadge status={item?.status} />
          </div>

          <div className="absolute right-2.5 top-2.5 z-10 sm:right-3 sm:top-3">
            <SaveButton size="sm" isSaved={isSaved} onToggle={handleSave} />
          </div>

          <div className="absolute inset-x-2.5 bottom-2.5 z-10 flex items-center justify-between gap-2 sm:inset-x-3 sm:bottom-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-slate-950/85 px-2 py-1 text-[9px] font-semibold text-amber-300 backdrop-blur-sm sm:px-2.5 sm:text-[10px]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 sm:h-3.5 sm:w-3.5" />
              <span>{ratingValue.toFixed(1)}</span>
              {reviewCount > 0 && <span className="text-slate-400">({reviewCount})</span>}
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-slate-950/85 px-2 py-1 text-[9px] font-semibold text-emerald-300 backdrop-blur-sm sm:px-2.5 sm:text-[10px]">
              <Eye className="h-3 w-3 text-emerald-400 sm:h-3.5 sm:w-3.5" />
              <span>{formatCompactMetric(viewCount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-w-0 flex-col gap-2 p-2.5 sm:gap-3 sm:p-3.5">
        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <h3 className="min-w-0 flex-1 line-clamp-2 break-words text-[12px] font-bold leading-[1.35] tracking-[0.02em] text-white sm:text-[13px]">
              {item?.title || "Competition"}
            </h3>
            {item?.category && (
              <span className="w-fit self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.13em] text-emerald-300 sm:max-w-[40%] sm:truncate sm:px-2 sm:text-[8px]">
                {item.category}
              </span>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 py-1.5 text-[10px] text-slate-200 shadow-inner shadow-slate-950/40 sm:gap-2 sm:rounded-xl sm:px-2.5 sm:text-[11px]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400 sm:h-4 sm:w-4" />
            <span
              title={fullLocation}
              className="min-w-0 flex-1 truncate leading-snug tracking-[0.01em]"
            >
              {displayLocation}
            </span>
          </div>
        </div>

        <div className="min-w-0 space-y-1.5">
          <div className="grid gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/70 p-1.5 text-[10px] text-slate-300 sm:rounded-xl sm:grid-cols-[1fr_auto] sm:items-center sm:gap-2 sm:px-2 sm:text-[11px]">
            <span className="flex min-w-0 items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-400 sm:h-4 sm:w-4" />
              <span className="min-w-0 break-words leading-relaxed text-slate-200">{displayDate}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-slate-200">
              <Users className="h-3.5 w-3.5 shrink-0 text-emerald-400 sm:h-4 sm:w-4" />
              <span className="truncate leading-relaxed">{seatAvailabilityText}</span>
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 py-1.5 sm:rounded-xl sm:px-2.5">
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-300 sm:text-[11px]">
              <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400 sm:h-4 sm:w-4" />
              <span className="min-w-0 break-words font-semibold text-slate-100">{prizeLabel}</span>
            </div>
            <div className="min-w-0 text-right text-[10px] text-slate-300 sm:text-[11px]">
              <div className="text-[7px] uppercase tracking-[0.14em] text-slate-400 sm:text-[8px]">Entry</div>
              <div className="break-words font-bold text-emerald-300">{normalizeAmount(item?.entryFee || item?.fee || item?.entry)}</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleViewClick}
          className="mt-0.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-2 text-[10px] font-bold text-slate-950 shadow-[0_12px_24px_rgba(16,185,129,0.2)] transition-all duration-200 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99] sm:text-xs"
        >
          View details
        </button>
      </div>
    </article>
  );
};

export default CompetitionCard;