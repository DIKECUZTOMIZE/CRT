import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Share2,
  ShieldCheck,
  Calendar,
  Globe2,
  Building2,
  Users,
  Tag,
  Sparkles,
  Eye,
  Star,
} from "lucide-react";
import { getDaysRemaining } from "../../../utils/eventDetailsUtils";

const formatCompactMetric = (value) => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "0";
  }

  if (numericValue >= 1000000) {
    return `${(numericValue / 1000000).toFixed(1)}M`;
  }

  if (numericValue >= 1000) {
    return `${(numericValue / 1000).toFixed(1)}K`;
  }

  return String(numericValue);
};

export const EventHero = ({ event, onShare, onRate, isAuthenticated = false }) => {
  const authUser = useSelector((state) => state.auth.user);
  const currentUserId = authUser?._id || authUser?.id || null;

  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");

  const registrationDeadline =
    event?.meta?.registrationDeadline ||
    event?.overview?.registrationDeadline ||
    event?.registrationEnd ||
    event?.registrationDeadline ||
    event?.meta?.startDate ||
    event?.overview?.startDate ||
    event?.startDate;

  const daysRemainingText = registrationDeadline
    ? getDaysRemaining(registrationDeadline)
    : null;

  const feeSource =
    event?.entryFee && typeof event.entryFee === "object"
      ? event.entryFee
      : {
          isFree: Boolean(event?.isFree),
          amount: Number(event?.fee || 0),
          categories: [],
        };

  const entryFee =
    feeSource.isFree || Number(feeSource.amount || 0) === 0
      ? "Free Entry"
      : feeSource.amount
        ? `₹${feeSource.amount}`
        : null;

  const viewCount = Number(event?.viewsCount ?? event?.viewCount ?? 0) || 0;
  const ratingValue = Number(event?.avgRating ?? event?.rating ?? 0) || 0;
  const ratingCount = Number(event?.ratingsCount ?? event?.reviewCount ?? event?.ratingCount ?? 0) || 0;
  const currentUserRating = Number(
    event?.userRating ??
      event?.myRating ??
      event?.ratings?.find((item) => String(item?.userId) === String(currentUserId))?.value ??
      0
  ) || 0;

  const organizerName = event?.organizer?.name || "Official Organizer";
  const organizerLogo = event?.organizer?.logo || event?.organizer?.logoUrl || "";
  const bannerUrl = event?.bannerUrl || event?.cardImageUrl || "/assets/images/banner-placeholder.png";
  const eventMode = event?.mode || "";
  const statusValue = String(event?.status || "").trim().toLowerCase();
  const hasRatingAccess = Boolean(onRate) && isAuthenticated;

  const statusPalette = {
    live: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    upcoming: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    completed: "border-blue-500/30 bg-blue-500/15 text-blue-300",
    ended: "border-slate-500/30 bg-slate-500/15 text-slate-200",
    cancelled: "border-rose-500/30 bg-rose-500/15 text-rose-300",
    canceled: "border-rose-500/30 bg-rose-500/15 text-rose-300",
    cancel: "border-rose-500/30 bg-rose-500/15 text-rose-300",
    postponed: "border-violet-500/30 bg-violet-500/15 text-violet-300",
    postpond: "border-violet-500/30 bg-violet-500/15 text-violet-300",
    pospond: "border-violet-500/30 bg-violet-500/15 text-violet-300",
  };

  React.useEffect(() => {
    if (currentUserRating > 0 && currentUserRating !== selectedRating) {
      setSelectedRating(currentUserRating);
    }
  }, [currentUserRating, selectedRating]);

  if (!event) return null;

  const visibleRating = selectedRating || currentUserRating;

  const handleRatingSubmit = async (nextValue) => {
    if (!onRate || !isAuthenticated) return;

    setIsSubmittingRating(true);
    setRatingMessage("");

    try {
      await onRate(nextValue);
      setSelectedRating(nextValue);
      setRatingMessage("Thanks for rating this event.");
    } catch (error) {
      setRatingMessage(error?.message || "Unable to save rating right now.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 p-3.5 shadow-2xl backdrop-blur-xl sm:p-6">
      {/* BANNER CONTAINER */}
      <div className="group relative h-52 w-full overflow-hidden rounded-xl bg-slate-950 sm:h-80 md:h-96">
        <img
          src={bannerUrl}
          alt={event?.title || "Event Banner"}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* GRADIENT OVERLAYS FOR TEXT READABILITY */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-transparent to-transparent" />

        {/* TOP LEFT BADGES */}
        <div className="absolute left-3 top-3 flex max-w-[85%] flex-wrap items-center gap-2 sm:left-4 sm:top-4">
          {event?.status && (
            <span
              className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-lg backdrop-blur-md sm:text-xs ${statusPalette[statusValue] || "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"}`}
            >
              <span className="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current animate-pulse" />
              <span className="truncate">{event.status}</span>
            </span>
          )}

          {/* ONLINE / OFFLINE MODE TAG */}
          {eventMode && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-slate-300 shadow-lg backdrop-blur-md sm:px-3 sm:text-xs">
              {eventMode.toLowerCase() === "online" ? (
                <Globe2 className="h-3 w-3 text-emerald-400" />
              ) : (
                <Building2 className="h-3 w-3 text-emerald-400" />
              )}
              {eventMode}
            </span>
          )}
        </div>

        {/* TOP RIGHT FLOATING ACTIONS */}
        <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/80 text-slate-300 shadow-lg backdrop-blur-md transition-all active:scale-95 hover:border-emerald-500/50 hover:bg-slate-900 hover:text-emerald-400 sm:h-9 sm:w-9"
              title="Share Event"
            >
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>

        {/* MOBILE OVERLAY: DAYS REMAINING (Bottom Left on Image) */}
        {daysRemainingText && (
          <div className="absolute bottom-3 left-3 sm:hidden">
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-slate-950/90 px-2 py-0.5 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
              <Calendar className="h-2.5 w-2.5 shrink-0" />
              {daysRemainingText}
            </span>
          </div>
        )}
      </div>

      {/* HEADER & META CONTENT */}
      <div className="mt-4 space-y-3 sm:mt-5">
        {/* TITLE */}
        <h1 className="break-words text-lg font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
          {event?.title}
        </h1>

        {/* ORGANIZER & QUICK SPEC CHIPS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
          {/* ORGANIZER PROFILE */}
          <div className="flex items-center gap-2">
            {organizerLogo ? (
              <img
                src={organizerLogo}
                alt={organizerName}
                className="h-7 w-7 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                {organizerName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Organized By
              </p>
              <p className="flex items-center gap-1 text-xs font-bold text-emerald-400 sm:text-sm">
                <span>{organizerName}</span>
                {event?.organizer?.verified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                )}
              </p>
            </div>
          </div>

          {/* CHIPS ROW (Category, Team, Entry Fee) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {event?.category && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                <Tag className="h-3 w-3 text-emerald-400" />
                {event.category}
              </span>
            )}

            {event?.participationType && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                <Users className="h-3 w-3 text-emerald-400" />
                {event.participationType}
              </span>
            )}

            {entryFee && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold text-emerald-300">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                {entryFee}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 sm:text-xs">
              <Eye className="h-3.5 w-3.5 text-emerald-400" />
              {formatCompactMetric(viewCount)} views
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 sm:text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {ratingValue > 0 ? ratingValue.toFixed(1) : "New"}
              {ratingCount > 0 && <span className="text-slate-400">({ratingCount})</span>}
            </span>
          </div>

          {hasRatingAccess && (
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isActive = starValue <= visibleRating;

                  return (
                    <button
                      key={starValue}
                      type="button"
                      disabled={isSubmittingRating}
                      onClick={() => handleRatingSubmit(starValue)}
                      className="group rounded-full p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed"
                      aria-label={`Rate ${starValue} out of 5`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          isActive
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-600 group-hover:text-amber-300"
                        } transition-colors duration-150`}
                      />
                    </button>
                  );
                })}
              </div>

              {ratingMessage && (
                <p className="text-[10px] font-medium text-emerald-300 sm:text-xs">
                  {ratingMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventHero;
