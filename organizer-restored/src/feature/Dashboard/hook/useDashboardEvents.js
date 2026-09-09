import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

import { getOrganizerDashboardEvents } from "../api/dashboard.api.js";

const formatDate = (value) => {
  if (!value) return "TBA";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return "TBA";

  const normalizedValue = String(value).trim();
  if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(normalizedValue)) {
    const match = normalizedValue.match(/^(\d{1,2}:\d{2})\s?([AP]M)$/i);
    if (match) {
      const [, time, meridiem] = match;
      return `${time} ${meridiem.toUpperCase()}`;
    }
    return normalizedValue.toUpperCase();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const normalizeLocationValue = (event = {}) => {
  const seen = new Set();

  const parts = [
    event.location,
    event.venueAddress,
    event.city,
    event.district,
    event.state,
    event.pinCode,
  ]
    .filter((part) => typeof part === "string")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => part.split(",").map((segment) => segment.trim()))
    .filter((segment) => {
      const key = segment.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return parts.length ? parts.join(", ") : "Location TBA";
};

const normalizeEvents = (items = []) =>
  items.map((event) => ({
    id: event._id || event.id,
    title: event.title || "Untitled Event",
    category: event.category || "General",
    location: normalizeLocationValue(event),
    status: (event.status || "upcoming").toLowerCase(),
    date: formatDate(event.eventDate || event.eventStart || event.registrationStart),
    time: formatTime(event.eventTime || event.eventStart),
    bannerUrl: event.bannerUrl || event.cardImageUrl || "/assets/images/banner-placeholder.png",
  }));

export const useDashboardEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const list = await getOrganizerDashboardEvents();
      setEvents(normalizeEvents(list));
    } catch (err) {
      setEvents([]);
      setError(err?.message || "Unable to load dashboard events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const stats = useMemo(() => {
    const total = events.length;
    const live = events.filter((event) => event.status === "live").length;
    const upcoming = events.filter((event) => event.status === "upcoming").length;
    const completed = events.filter((event) => ["completed", "ended"].includes(event.status)).length;

    return [
      { label: "Total Events", value: total, description: "All created events" },
      { label: "Live", value: live, description: "Currently running" },
      { label: "Upcoming", value: upcoming, description: "Scheduled events" },
      { label: "Completed", value: completed, description: "Successfully finished" },
    ];
  }, [events]);

  const recentEvents = useMemo(() => events.slice(0, 4), [events]);

  const getStatIcon = (label) => {
    if (label === "Live") return CheckCircle2;
    if (label === "Upcoming") return Clock3;
    if (label === "Completed") return CheckCircle2;
    return CalendarDays;
  };

  const getStatusClassName = (status = "upcoming") => {
    const normalizedStatus = String(status).toLowerCase();

    if (normalizedStatus === "live") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    }

    if (normalizedStatus === "upcoming") {
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    }

    if (["cancelled", "canceled"].includes(normalizedStatus)) {
      return "border-rose-500/30 bg-rose-500/10 text-rose-400";
    }

    if (normalizedStatus === "postponed") {
      return "border-violet-500/30 bg-violet-500/10 text-violet-400";
    }

    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  };

  const scrollSlider = (ref, direction) => {
    if (!ref?.current) return;

    const firstCard = ref.current.firstChild;
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 260;

    ref.current.scrollBy({
      left: direction === "next" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  };

  return {
    events,
    recentEvents,
    stats,
    loading,
    error,
    refetch: fetchEvents,
    getStatIcon,
    getStatusClassName,
    scrollSlider,
  };
};
