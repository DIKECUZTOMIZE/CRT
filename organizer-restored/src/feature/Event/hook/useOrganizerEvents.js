import { useCallback, useEffect, useMemo, useState } from "react";

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
  const incomingStatus = String(event?.status || "").trim().toLowerCase();

  if (["cancelled", "postponed", "upcoming", "live", "completed", "ended"].includes(incomingStatus)) {
    return incomingStatus;
  }

  const start = combineDateTime(event?.eventDate || event?.eventStart, event?.eventStartTime || event?.eventTime);
  const end = combineDateTime(event?.eventEndDate || event?.eventEnd || event?.eventDate || event?.eventStart, event?.eventEndTime || event?.eventTime || event?.eventStartTime);

  if (!start && !end) return "upcoming";

  const now = new Date();
  if (end && now > end) return "completed";
  if (start && now >= start && end && now < end) return "live";
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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const list = await getOrganizerEvents();
      setEvents(normalizeEvents(list));
    } catch (err) {
      setEvents([]);
      setError(err?.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (eventId, eventTitle) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${eventTitle}"?`);
    if (!confirmed) return false;

    try {
      await deleteOrganizerEvent(eventId);
      await fetchEvents();
      return true;
    } catch (err) {
      throw err;
    }
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
