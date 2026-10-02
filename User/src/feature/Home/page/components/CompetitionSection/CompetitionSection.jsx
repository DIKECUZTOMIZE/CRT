import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { CompetitionCard } from "../../../../../shared/components/competition/CompetitionCard/CompetitionCard";

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
  if (event?._isNormalized) return event;

  const entries = Array.isArray(event?.entries) ? event.entries.filter(Boolean) : [];
  const minFee = entries.reduce((min, entry) => {
    const amount = Number(entry?.price ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) return min;
    return min === Number.POSITIVE_INFINITY ? amount : Math.min(min, amount);
  }, Number.POSITIVE_INFINITY);

  const feeText =
    !entries.length || minFee === Number.POSITIVE_INFINITY || minFee === 0
      ? "Free"
      : `₹${minFee}`;

  const startDate = event?.eventDate || event?.eventStart || event?.startDate || event?.registrationStart || "";
  const endDate = event?.eventEndDate || event?.eventEnd || event?.endDate || event?.registrationEnd || "";
  const dateText = [startDate, endDate].filter(Boolean).join(" - ") || "TBA";
  const totalSeats = Number(event?.totalSeats ?? event?.seatsAvailable ?? event?.availableSeats ?? 0);
  const prizeValue = Number(event?.totalPrizePool ?? event?.prizePool ?? 0);
  const prizeText = prizeValue > 0 ? `₹${prizeValue.toLocaleString("en-IN")}` : "No prize pool";

  return {
    _isNormalized: true,
    id: event?._id || event?.id,
    title: event?.title || "Untitled Event",
    organizer: event?.organizerContact?.name || event?.organizer?.name || event?.organizerName || "Official Organizer",
    category: event?.category || "General",
    viewsCount: Number(event?.viewsCount ?? event?.viewCount ?? 0),
    banner:
      event?.bannerUrl ||
      event?.cardImageUrl ||
      event?.banner ||
      event?.image ||
      event?.imageUrl ||
      "",
    prize: prizeText,
    status: (event?.status || "upcoming").toLowerCase(),
    date: dateText,
    location: normalizeLocationValue(event),
    seatsAvailable: totalSeats > 0 ? totalSeats : 0,
    entryFee: feeText,
    seatAvailability: event?.seatAvailability || (totalSeats > 0 ? "Available" : "Not Available"),
    totalSeats,
    rating: Number(event?.rating ?? event?.avgRating ?? 0),
    reviewsCount: Number(event?.reviewsCount ?? event?.reviewCount ?? event?.ratingCount ?? 0),
    customSeatDetails: event?.customSeatDetails || "",
  };
};

const DESKTOP_VISIBLE_ITEMS = 6;
const MOBILE_INITIAL_VISIBLE_ITEMS = 2;

const CompetitionSection = ({
  title,
  subtitle,
  competitions = [],
  savedIds = [],
  onToggleSave,
  onCompetitionClick,
  className = "",
  titleClassName = "",
}) => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);

  const itemsToDisplay = useMemo(() => {
    const rawList = Array.isArray(competitions) ? competitions : [];
    return rawList.map(normalizeHomeEvent);
  }, [competitions]);

  const initialVisibleCount = isMobile ? MOBILE_INITIAL_VISIBLE_ITEMS : DESKTOP_VISIBLE_ITEMS;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateMobileState = () => setIsMobile(mediaQuery.matches);

    updateMobileState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMobileState);
      return () => mediaQuery.removeEventListener("change", updateMobileState);
    }

    mediaQuery.addListener(updateMobileState);
    return () => mediaQuery.removeListener(updateMobileState);
  }, []);

  useEffect(() => {
    setShowAll(false);
  }, [title, itemsToDisplay.length, isMobile]);

  const visibleItems = useMemo(() => {
    const maxVisible = showAll ? itemsToDisplay.length : Math.min(initialVisibleCount, itemsToDisplay.length);
    return itemsToDisplay.slice(0, maxVisible);
  }, [itemsToDisplay, showAll, initialVisibleCount]);

  const handleSliderScroll = (direction) => {
    if (!sliderRef.current) return;

    const cardWidth = sliderRef.current.firstChild?.offsetWidth || 260;
    sliderRef.current.scrollBy({
      left: direction === "next" ? cardWidth * 1.2 : -cardWidth * 1.2,
      behavior: "smooth",
    });
  };

  const handleCompetitionClick = (item) => {
    const id = item?.id ?? item?._id;

    if (onCompetitionClick) {
      onCompetitionClick(item);
      return;
    }

    if (id) {
      navigate(`/events/${id}`);
    }
  };

  return (
    <section className={`w-full py-4 sm:py-5 ${className}`.trim()}>
      <style>{`
        @keyframes cardFade {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className={`text-sm font-bold tracking-tight text-slate-900 sm:text-xl sm:text-white ${titleClassName}`.trim()}>
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {itemsToDisplay.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="inline-flex h-6 shrink-0 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-0 text-[3px] font-semibold uppercase tracking-[0.12em] text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-[#ECFDF5] active:scale-[0.98] sm:h-7 sm:text-[6.5px]"
            >
              {showAll ? "View Less" : "View All"}
            </button>
          )}

          {itemsToDisplay.length > 1 && (
            <div className="hidden items-center gap-1 sm:hidden">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => handleSliderScroll("prev")}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => handleSliderScroll("next")}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {itemsToDisplay.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-8 text-center text-sm text-slate-400">
          No events available yet. Organizer-created events will appear here.
        </div>
      ) : (
        <div
          ref={sliderRef}
          className="
            flex
            gap-2
            overflow-x-auto
            pb-2
            snap-x
            snap-mandatory
            scrollbar-none
            [-ms-overflow-style:none]
            [scrollbar-width:none]
            sm:grid
            sm:grid-cols-2
            sm:gap-5
            sm:overflow-visible
            sm:pb-0
            md:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
          "
        >
          {visibleItems.map((item, index) => {
            const id = item?.id ?? item?._id ?? index;
            const isSaved = savedIds.some((savedId) => String(savedId) === String(id));

            return (
              <div
                key={id}
                className="shrink-0 snap-start transition-all duration-300 ease-out sm:w-full sm:max-w-none sm:min-w-0 md:min-w-0"
                style={{
                  width: "calc(50% - 0.25rem)",
                  minWidth: "calc(50% - 0.25rem)",
                  flex: "0 0 calc(50% - 0.25rem)",
                  animation: "cardFade 0.28s ease-out both",
                }}
              >
                <CompetitionCard
                  item={item}
                  isSaved={isSaved}
                  onToggleSave={onToggleSave}
                  onClick={() => handleCompetitionClick(item)}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CompetitionSection;