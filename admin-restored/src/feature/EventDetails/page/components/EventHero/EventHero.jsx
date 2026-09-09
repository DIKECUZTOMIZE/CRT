import React from "react";
import {
  Bookmark,
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

  if (!Number.isFinite(numericValue) || numericValue <= 0) return "0";
  if (numericValue >= 1000000) return `${(numericValue / 1000000).toFixed(1)}M`;
  if (numericValue >= 1000) return `${(numericValue / 1000).toFixed(1)}K`;

  return String(numericValue);
};

export const EventHero = ({ event, isBookmarked, onBookmark, onShare }) => {
  if (!event) return null;

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
      : { isFree: Boolean(event?.isFree), amount: Number(event?.fee || 0), categories: [] };

  const entryFee =
    feeSource.isFree || Number(feeSource.amount || 0) === 0
      ? "Free Entry"
      : feeSource.amount
        ? `₹${feeSource.amount}`
        : null;

  const viewCount = Number(event?.viewsCount ?? event?.viewCount ?? 0) || 0;
  const ratingValue = Number(event?.avgRating ?? event?.rating ?? 0) || 0;
  const ratingCount = Number(event?.ratingsCount ?? event?.reviewCount ?? event?.ratingCount ?? 0) || 0;
  const bannerUrl = event?.bannerUrl || event?.cardImageUrl || "/assets/images/banner-placeholder.png";

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
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
          {event?.status && (
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 shadow-lg backdrop-blur-md sm:text-xs">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {event.status}
            </span>
          )}

          {/* ONLINE / OFFLINE MODE TAG */}
          {event?.mode && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-950/80 px-2.5 py-1 text-[10px] font-bold text-slate-300 shadow-lg backdrop-blur-md sm:px-3 sm:text-xs">
              {event.mode.toLowerCase() === "online" ? (
                <Globe2 className="h-3 w-3 text-emerald-400" />
              ) : (
                <Building2 className="h-3 w-3 text-emerald-400" />
              )}
              {event.mode}
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
        <h1 className="text-lg font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
          {event?.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 pt-1">
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

        {/* ORGANIZER & QUICK SPEC CHIPS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
          {/* ORGANIZER PROFILE */}
          <div className="flex items-center gap-2">
            {event?.organizer?.logoUrl ? (
              <img
                src={event.organizer.logoUrl}
                alt={event?.organizer?.name}
                className="h-7 w-7 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                {event?.organizer?.name
                  ? event.organizer.name.charAt(0).toUpperCase()
                  : "O"}
              </div>
            )}

            <div className="flex flex-col">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Organized By
              </p>
              <p className="flex items-center gap-1 text-xs font-bold text-emerald-400 sm:text-sm">
                <span>{event?.organizer?.name || "Official Organizer"}</span>
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

            {/* {entryFee && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold text-emerald-300">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                {entryFee}
              </span>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventHero;
