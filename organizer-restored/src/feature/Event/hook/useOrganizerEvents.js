import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";

import { deleteOrganizerEvent, getOrganizerEvents } from "../api/event.api.js";

const filterTabs = [
  "All",
  "live",
  "upcoming",
  "completed",
  "ended",
  "cancelled",
  "postponed",
];

const EMPTY_EVENTS = [];

const normalizeEventStatus = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "canceled") return "cancelled";
  return normalized;
};

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

const parseTimeValue = (value) => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([0-9]{1,2}):([0-9]{2})\s*([AaPp][Mm])$/);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3].toUpperCase();

    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;

    return new Date(0, 0, 0, hours, minutes, 0);
  }

  const simpleMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})$/);
  if (simpleMatch) {
    return new Date(0, 0, 0, Number(simpleMatch[1]), Number(simpleMatch[2]), 0);
  }

  return null;
};

const combineDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const time = parseTimeValue(timeValue);
  if (!time) return date;

  const nextDate = new Date(date);
  nextDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return nextDate;
};

const deriveEventStatus = (event) => {
  const incomingStatus = normalizeEventStatus(event?.status);

  if (["cancelled", "postponed", "completed", "ended"].includes(incomingStatus)) {
    return incomingStatus;
  }

  const start = combineDateTime(event?.eventDate || event?.eventStart, event?.eventStartTime || event?.eventTime);
  const end = combineDateTime(event?.eventEndDate || event?.eventEnd || event?.eventDate || event?.eventStart, event?.eventEndTime || event?.eventTime || event?.eventStartTime);

  if (!start && !end) return "upcoming";

  const now = new Date();
  if (end && now > end) return "completed";
  if (start && now >= start) return "live";
  if (start && now < start) return "upcoming";
  return "upcoming";
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
  items.map((event) => {
    const status = deriveEventStatus(event);

    return {
      id: event._id || event.id,
      title: event.title || "Untitled Event",
      category: event.category || "General",
      location: normalizeLocationValue(event),
      date: formatDate(event.eventDate || event.eventStart || event.registrationStart),
      time: formatTime(event.eventTime || event.eventStart),
      status,
      eventMode: event.eventMode || "Offline",
      bannerUrl: event.bannerUrl || event.cardImageUrl || "/assets/images/banner-placeholder.png",
    };
  });

export const useOrganizerEvents = () => {
  const { user } = useSelector((state) => state.auth || {});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const query = useQuery({
    queryKey: ["organizer-events", user?.id || "anon"],
    queryFn: getOrganizerEvents,
    select: normalizeEvents,
  });

  const events = query.isError ? EMPTY_EVENTS : query.data ?? EMPTY_EVENTS;
  const loading = query.isFetching;
  const error = query.isError ? query.error?.message || "Unable to load events." : "";
  const fetchEvents = query.refetch;

  const deleteEvent = useCallback(async (eventId, eventTitle) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${eventTitle}"?`);
    if (!confirmed) return false;

    await deleteOrganizerEvent(eventId);
    await fetchEvents();
    return true;
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query);

      const matchesFilter = selectedFilter === "All" || event.status === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [events, searchQuery, selectedFilter]);

  return {
    events,
    filteredEvents,
    loading,
    error,
    fetchEvents,
    deleteEvent,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    filterTabs,
  };
};
