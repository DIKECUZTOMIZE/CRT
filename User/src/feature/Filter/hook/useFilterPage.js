import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getSavedEvents, toggleSavedEvent } from "../../UserProfile/api/userProfile.api.js";
import { useFilterEvents } from "./useFilterEvents.jsx";

const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const normalizeOptionKey = (value = "") =>
  String(value ?? "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeLocationToken = (token = "") => {
  const cleaned = String(token || "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  if (/^\d{4,6}$/.test(cleaned)) return "";
  if (/^\d+$/.test(cleaned)) return "";
  if (/^([A-Za-z])\1{5,}$/i.test(cleaned)) return "";
  if (cleaned.length > 40) return "";

  return cleaned;
};

const parseLocationParts = (locationText = "") => {
  const cleaned = String(locationText || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return { state: "", city: "" };

  const parts = cleaned
    .split(/[,/;]/)
    .map((part) => normalizeLocationToken(part))
    .filter(Boolean);

  const stateMatch = [...parts].reverse().find((part) => {
    const candidate = part.toLowerCase();
    return INDIA_STATES.some((state) => {
      const stateName = state.toLowerCase();
      return candidate === stateName || candidate.includes(stateName);
    });
  });

  const state = stateMatch || parts[parts.length - 1] || "";
  const stateIndex = parts.lastIndexOf(state);
  const cityCandidates = stateIndex > -1 ? parts.slice(0, stateIndex) : parts;

  const city =
    [...cityCandidates]
      .reverse()
      .find((part) => {
        const candidate = part.toLowerCase();
        return (
          candidate.length > 1 &&
          !/^(india|near|road|street|main|district|zone|ward|block|colony|market|campus)$/i.test(candidate) &&
          !/\d/.test(candidate) &&
          !candidate.includes("m") &&
          !candidate.includes("pm")
        );
      }) ||
    cityCandidates.find((part) => part.length > 1) ||
    "";

  return {
    state: state || cleaned,
    city: city || cleaned,
  };
};

const extractLocationValue = (event, key) => {
  const raw = event?.raw || event || {};
  const directValue = raw?.[key] || event?.[key];
  if (directValue) return String(directValue).trim();

  const locationText = raw?.location || event?.location || raw?.venueAddress || "";
  const parsed = parseLocationParts(locationText);

  if (key === "state") return parsed.state || "";
  if (key === "city") return parsed.city || "";

  return "";
};

export const useFilterPage = () => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const currentLocation = useSelector((state) => state.location);
  const authUser = useSelector((state) => state.auth.user);
  const authStatus = useSelector((state) => state.auth.status);
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: "",
    organizer: "",
    state: currentLocation?.state && currentLocation.state !== "India" ? currentLocation.state : "",
    city: currentLocation?.city && currentLocation.city !== "All India" ? currentLocation.city : "",
    location: "",
    categories: [],
    ageGroups: [],
    isFreeOnly: false,
    minPrize: 0,
    dateRange: "all",
  });

  useEffect(() => {
    if (!currentLocation) return;

    const nextState = currentLocation.state && currentLocation.state !== "India" ? currentLocation.state : "";
    const nextCity = currentLocation.city && currentLocation.city !== "All India" ? currentLocation.city : "";

    setFilters((previous) => {
      if (
        previous.state === nextState &&
        previous.city === nextCity &&
        previous.search === "" &&
        previous.organizer === ""
      ) {
        return previous;
      }

      return {
        ...previous,
        state: nextState,
        city: nextCity,
      };
    });
  }, [currentLocation]);

  const { events, isLoading } = useFilterEvents(filters);

  const savedEventsQuery = useQuery({
    queryKey: ["user-saved-events"],
    queryFn: getSavedEvents,
    enabled: !!authUser && authStatus === "authenticated",
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const normalizeSavedId = (event) => String(event?.id ?? event?._id ?? "");

  const savedIds = useMemo(
    () =>
      Array.isArray(savedEventsQuery.data)
        ? savedEventsQuery.data.map((event) => normalizeSavedId(event)).filter(Boolean)
        : [],
    [savedEventsQuery.data]
  );

  const handleToggleSave = async (eventId) => {
    if (!eventId || !authUser) return;

    const targetId = String(eventId);
    const previousSaved = Array.isArray(savedEventsQuery.data) ? savedEventsQuery.data : [];
    const isAlreadySaved = previousSaved.some((event) => normalizeSavedId(event) === targetId);

    queryClient.setQueryData(["user-saved-events"], () => {
      if (isAlreadySaved) {
        return previousSaved.filter((event) => normalizeSavedId(event) !== targetId);
      }

      return [...previousSaved, { id: targetId, _id: targetId }];
    });

    try {
      await toggleSavedEvent(targetId);
    } catch (error) {
      queryClient.setQueryData(["user-saved-events"], previousSaved);
      throw error;
    }
  };

  const categoryOptions = useMemo(() => {
    const seen = new Set();
    return events
      .map((event) => event.category)
      .filter(Boolean)
      .filter((value) => {
        const key = normalizeOptionKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [events]);

  const stateOptions = useMemo(() => {
    const seen = new Set();
    return events
      .map((event) => extractLocationValue(event, "state"))
      .filter(Boolean)
      .filter((value) => {
        const key = normalizeOptionKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [events]);

  const cityOptions = useMemo(() => {
    const seen = new Set();
    return events
      .map((event) => extractLocationValue(event, "city"))
      .filter(Boolean)
      .filter((value) => {
        const key = normalizeOptionKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [events]);

  const ageGroupOptions = useMemo(() => {
    const seen = new Set();
    return [...new Set(
      events.flatMap((event) => {
        const raw = event?.raw || event || {};
        const directValues = raw?.ageGroup || raw?.ageGroups || event?.ageGroup || event?.ageGroups || [];

        if (Array.isArray(directValues)) {
          return directValues.map((value) => String(value).trim()).filter(Boolean);
        }

        if (directValues) {
          return [String(directValues).trim()].filter(Boolean);
        }

        return [];
      })
    )]
      .filter((value) => {
        const key = normalizeOptionKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredCompetitions = useMemo(() => (Array.isArray(events) ? [...events] : []), [events]);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.organizer ? 1 : 0) +
    (filters.state ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.categories?.length || 0) +
    (filters.ageGroups?.length || 0) +
    (filters.isFreeOnly ? 1 : 0) +
    (filters.minPrize > 0 ? 1 : 0) +
    (filters.dateRange !== "all" ? 1 : 0);

  const handleResetFilters = () => {
    const defaultState = currentLocation?.state && currentLocation.state !== "India" ? currentLocation.state : "";
    const defaultCity = currentLocation?.city && currentLocation.city !== "All India" ? currentLocation.city : "";

    setFilters({
      search: "",
      organizer: "",
      state: defaultState,
      city: defaultCity,
      location: "",
      categories: [],
      ageGroups: [],
      isFreeOnly: false,
      minPrize: 0,
      dateRange: "all",
    });
  };

  return {
    filters,
    setFilters,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    events: filteredCompetitions,
    isLoading,
    savedIds,
    categoryOptions,
    stateOptions,
    cityOptions,
    ageGroupOptions,
    activeFilterCount,
    handleToggleSave,
    handleResetFilters,
  };
};

export default useFilterPage;
