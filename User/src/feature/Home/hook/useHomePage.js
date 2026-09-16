import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

import { useHomeEvents } from "./useHomeEvents.jsx";
import { getSavedEvents, toggleSavedEvent } from "../../UserProfile/api/userProfile.api.js";

const isKnownBrokenUploadUrl = (value) => {
  if (!value) return false;

  const normalized = String(value).trim();
  return /(?:^|\/)(?:uploads\/)?(?:banner_|test-banner-)[^\s"'<>]+\.(?:avif|jpg|jpeg|png|webp|gif)/i.test(normalized);
};

const fetchHomeSlides = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.homeSlider || "/api/home-slider");
    const slides = Array.isArray(response?.data?.data) ? response.data.data : [];

    return slides
      .filter((slide) => slide && slide.image && !isKnownBrokenUploadUrl(slide.image))
      .map((slide) => ({
        id: slide.id || slide._id || slide.title,
        title: slide.title || "Featured event",
        subtitle: slide.subtitle || slide.description || "",
        image: slide.image,
        description: slide.description || "",
      }));
  } catch (error) {
    throw normalizeError(error);
  }
};

const getMinEntryFee = (event) => {
  const entries = Array.isArray(event?.entries) ? event.entries.filter(Boolean) : [];
  const prices = entries
    .map((entry) => Number(entry?.price ?? 0))
    .filter((price) => Number.isFinite(price));

  return prices.length ? Math.min(...prices) : 0;
};

const getPrizePool = (event) => Number(event?.totalPrizePool ?? 0) || 0;
const getViewsCount = (event) => Number(event?.viewsCount ?? event?.viewCount ?? event?.impressions ?? 0) || 0;
const getRatingValue = (event) => Number(event?.rating ?? event?.avgRating ?? 0) || 0;

const normalizeText = (value) => String(value ?? "").trim().toLowerCase();

const getLocationMatchScore = (event, city, state) => {
  const text = normalizeText([
    event?.location,
    event?.venueAddress,
    event?.city,
    event?.district,
    event?.state,
  ].join(" "));

  const cityText = normalizeText(city);
  const stateText = normalizeText(state);

  if (!text) return 0;
  if (cityText && text.includes(cityText)) return 3;
  if (stateText && text.includes(stateText)) return 2;
  if (text.includes("guwahati") || text.includes("assam") || text.includes("north east")) return 1;
  return 0;
};

const matchesQuickFilterByName = (event, filterName) => {
  if (!filterName || filterName === "all") return true;

  const mode = String(event?.mode || event?.eventMode || "").toLowerCase();
  const status = String(event?.status || "").toLowerCase();
  const entryFee = getMinEntryFee(event);

  if (filterName === "online") return mode.includes("online") || /online/i.test(event?.location || "");
  if (filterName === "in-person") return mode.includes("offline") || mode.includes("in-person") || (!mode && !/online/i.test(event?.location || ""));
  if (filterName === "free") return entryFee === 0 || /free/i.test(String(event?.entryFee || ""));
  if (filterName === "upcoming") return status !== "completed" && status !== "closed";
  if (filterName === "budget") return entryFee > 0 && entryFee <= 500;
  if (filterName === "premium") return getPrizePool(event) >= 150000 || entryFee >= 1500;

  return true;
};

const byNewestFirst = (a, b) => {
  const aTime = new Date(a?.createdAt || a?.updatedAt || a?.eventDate || 0).getTime();
  const bTime = new Date(b?.createdAt || b?.updatedAt || b?.eventDate || 0).getTime();
  return bTime - aTime;
};

const byPopularity = (a, b) => {
  const aScore = getViewsCount(a) + (getRatingValue(a) * 1000) + (getPrizePool(a) * 0.2);
  const bScore = getViewsCount(b) + (getRatingValue(b) * 1000) + (getPrizePool(b) * 0.2);
  return bScore - aScore;
};

const byNearbyPriority = (a, b, city, state) => {
  const aMatch = getLocationMatchScore(a, city, state);
  const bMatch = getLocationMatchScore(b, city, state);

  if (aMatch !== bMatch) return bMatch - aMatch;
  return byPopularity(a, b);
};

const byBudget = (a, b) => getMinEntryFee(a) - getMinEntryFee(b) || byPopularity(b, a);
const byHighBudget = (a, b) => getPrizePool(b) - getPrizePool(a) || byPopularity(b, a);

export const useHomePage = ({ initialLoginOpen = false, initialRegisterOpen = false } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.user);
  const authStatus = useSelector((state) => state.auth.status);
  const currentLocation = useSelector((state) => state.location);
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(
    Boolean(!authUser && (initialLoginOpen || initialRegisterOpen || ["/login", "/register"].includes(location.pathname)))
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextSearch = params.get("search") || "";

    setSearchQuery((prev) => {
      if (prev === nextSearch) return prev;
      return nextSearch;
    });
  }, [location.search]);

  useEffect(() => {
    if (!authUser) {
      setIsAuthModalOpen(Boolean(initialLoginOpen || initialRegisterOpen || ["/login", "/register"].includes(location.pathname)));
    }
  }, [authUser, initialLoginOpen, initialRegisterOpen, location.pathname]);

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);

    if (location.pathname === "/login" || location.pathname === "/register") {
      navigate("/", { replace: true });
    }
  };

  const {
    events: allEvents = [],
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useHomeEvents(searchQuery, selectedCategory);

  const { data: homeSlides = [] } = useQuery({
    queryKey: ["home-slider-slides"],
    queryFn: fetchHomeSlides,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 320;

      if (nearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  const effectiveSearchQuery = searchQuery.trim();

  const homeSections = useMemo(() => {
    const safeEvents = Array.isArray(allEvents) ? allEvents : [];
    const userCity = currentLocation?.city && currentLocation.city !== "All India" ? currentLocation.city : "";
    const userState = currentLocation?.state && currentLocation.state !== "India" ? currentLocation.state : "";

    const filteredEvents = safeEvents.filter((event) => {
      const matchesCategory =
        selectedCategory === "all" ||
        event?.category?.toLowerCase() === selectedCategory.toLowerCase();

      const searchableText = [
        event?.title,
        event?.tagline,
        event?.category,
        event?.location,
        event?.venueAddress,
        event?.city,
        event?.state,
        event?.district,
        event?.organizerName,
        event?.organizer?.name,
        event?.organizerContact?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !effectiveSearchQuery || searchableText.includes(effectiveSearchQuery.toLowerCase());

      const matchesQuick = matchesQuickFilterByName(event, activeQuickFilter);

      return matchesCategory && matchesSearch && matchesQuick;
    });

    const nearbyEvents = [...filteredEvents].sort((a, b) => byNearbyPriority(a, b, userCity, userState));
    const recentEvents = [...filteredEvents].sort(byNewestFirst);
    const popularEvents = [...filteredEvents].sort(byPopularity);
    const budgetEvents = [...filteredEvents]
      .filter((event) => getMinEntryFee(event) <= 500)
      .sort(byBudget);
    const highBudgetEvents = [...filteredEvents]
      .filter((event) => getPrizePool(event) >= 150000 || getMinEntryFee(event) >= 1500)
      .sort(byHighBudget);

    return {
      popularCompetitions: popularEvents.slice(0, 8),
      recentCompetitions: recentEvents.slice(0, 8),
      nearbyCompetitions: nearbyEvents.slice(0, 8),
      budgetFriendlyCompetitions: budgetEvents.slice(0, 8),
      highBudgetCompetitions: highBudgetEvents.slice(0, 8),
    };
  }, [allEvents, selectedCategory, effectiveSearchQuery, activeQuickFilter, currentLocation?.city, currentLocation?.state]);

  const visibleHomeSections = [
    { key: "popularCompetitions", title: "Popular Competitions" },
    { key: "recentCompetitions", title: "Recently Added" },
    { key: "nearbyCompetitions", title: "Nearby Events" },
    { key: "budgetFriendlyCompetitions", title: "Budget Friendly" },
    { key: "highBudgetCompetitions", title: "High Budget" },
  ].filter(({ key }) => (homeSections[key] || []).length > 0);

  return {
    authUser,
    authStatus,
    location,
    navigate,
    isAuthModalOpen,
    setIsAuthModalOpen,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    activeQuickFilter,
    setActiveQuickFilter,
    homeSlides,
    homeSections,
    visibleHomeSections,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    savedIds,
    handleToggleSave,
    closeAuthModal,
    effectiveSearchQuery,
  };
};

export default useHomePage;
