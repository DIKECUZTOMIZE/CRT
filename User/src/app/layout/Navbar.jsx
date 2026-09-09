import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  Bell,
  Trophy,
  User,
  MapPin,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

import { setUserLocation } from "../store/location.slice.js";
import { emitLocationUpdate } from "../config/socket.js";
import apiClient, { API_ENDPOINTS } from "../config/axios.js";

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Filter", path: "/filter" },
  { label: "About", path: "/about" },
];

const normalizeText = (value = "") => String(value ?? "").trim();

const toCanonicalKey = (value = "") => normalizeText(value).replace(/\s+/g, " ").toLowerCase();

const toDisplayLabel = (value = "") => {
  const cleaned = normalizeText(value).replace(/\s+/g, " ");
  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (_, prefix, char) => `${prefix}${char.toUpperCase()}`);
};

const cleanLocationToken = (value = "") => {
  const cleaned = normalizeText(value).replace(/[()]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (/^\d{4,6}$/.test(cleaned)) return "";
  if (/^\d+$/.test(cleaned)) return "";
  if (/^([A-Za-z])\1{5,}$/i.test(cleaned)) return "";
  if (cleaned.length > 40) return "";
  return cleaned;
};

const parseEventLocation = (event = {}) => {
  const rawState = normalizeText(event?.state || event?.locationState);
  const rawCity = normalizeText(event?.city || event?.locationCity);

  if (rawState || rawCity) {
    return {
      state: rawState || "",
      city: rawCity || "",
    };
  }

  const locationText = normalizeText(event?.location || event?.venueAddress || "");
  if (!locationText) return { state: "", city: "" };

  const parts = locationText
    .split(/[,/;]/)
    .map((part) => cleanLocationToken(part))
    .filter(Boolean);

  const state = parts.find((part) => /^(Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chhattisgarh|Goa|Gujarat|Haryana|Himachal Pradesh|Jharkhand|Karnataka|Kerala|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Odisha|Punjab|Rajasthan|Sikkim|Tamil Nadu|Telangana|Tripura|Uttar Pradesh|Uttarakhand|West Bengal|Andaman and Nicobar Islands|Chandigarh|Dadra and Nagar Haveli and Daman and Diu|Delhi|Jammu and Kashmir|Ladakh|Lakshadweep|Puducherry)$/i.test(part)) || "";

  const city = parts.find((part) => part && part !== state) || "";

  return {
    state: state || "",
    city: city || "",
  };
};

const defaultNotifications = [
  {
    id: 1,
    title: "New event matches your city",
    message: "3 competitions near Bengaluru are live today.",
    time: "2m ago",
    read: false,
  },
  {
    id: 2,
    title: "Profile reminder",
    message: "Complete your organizer profile to unlock more visibility.",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    title: "Payment update",
    message: "Your payout status has been updated successfully.",
    time: "Yesterday",
    read: true,
  },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const currentLocation = useSelector((state) => state.location);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationOptions, setLocationOptions] = useState({ states: [], citiesByState: {} });
  const [selectedState, setSelectedState] = useState(currentLocation?.state || "India");
  const [selectedCity, setSelectedCity] = useState(currentLocation?.city || "All India");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  useEffect(() => {
    if (currentLocation?.state) {
      setSelectedState(currentLocation.state);
    }
    if (currentLocation?.city) {
      setSelectedCity(currentLocation.city);
    }
  }, [currentLocation?.state, currentLocation?.city]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextValue = params.get("search") || "";
    setSearchValue(nextValue);
  }, [location.search]);

  const unreadNotifications = notifications.filter((item) => !item.read).length;

  const handleSearchSubmit = (nextValue = searchValue) => {
    const trimmed = String(nextValue || "").trim();

    if (!trimmed) {
      navigate("/", { replace: true });
      return;
    }

    navigate(`/?search=${encodeURIComponent(trimmed)}`, { replace: true });
  };

  const handleNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const accountPath = "/profile";
  const normalizedUser = user?.user && typeof user.user === "object" ? user.user : user;
  const resolvedUser = normalizedUser || user || {};
  const displayName = normalizeText(resolvedUser.fullName || resolvedUser.username || resolvedUser.name || "User");
  const avatarUrl = (
    resolvedUser.avatar ||
    resolvedUser.profileImage ||
    resolvedUser.picture ||
    resolvedUser.image ||
    resolvedUser.raw?.avatar ||
    resolvedUser.raw?.profileImage ||
    resolvedUser.raw?.picture ||
    resolvedUser.raw?.image ||
    resolvedUser.user?.avatar ||
    resolvedUser.user?.profileImage ||
    resolvedUser.user?.picture ||
    resolvedUser.user?.image ||
    ""
  )?.trim();
  const avatarInitial = String(displayName || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "D";
  const hasAvatar = Boolean(avatarUrl && avatarUrl !== "");

  useEffect(() => {
    let ignore = false;

    const fetchLocationOptions = async () => {
      setIsLocationLoading(true);

      try {
        const response = await apiClient.get(`${API_ENDPOINTS.publicEvents}?page=1&limit=200`);
        const events = Array.isArray(response?.data?.data?.events) ? response.data.data.events : [];

        const stateMap = new Map();

        events.forEach((event) => {
          const { state, city } = parseEventLocation(event);
          if (!state && !city) return;

          const normalizedState = normalizeText(state || "");
          const normalizedCity = normalizeText(city || "");

          if (normalizedState) {
            const stateKey = toCanonicalKey(normalizedState);
            if (!stateMap.has(stateKey)) {
              stateMap.set(stateKey, {
                label: toDisplayLabel(normalizedState),
                cities: new Set(),
              });
            }

            const stateEntry = stateMap.get(stateKey);
            if (normalizedCity) {
              const cityKey = toCanonicalKey(normalizedCity);
              if (!stateEntry.cities.has(cityKey)) {
                stateEntry.cities.add(cityKey);
              }
            }
          }
        });

        const states = Array.from(stateMap.keys())
          .map((stateKey) => stateMap.get(stateKey).label)
          .sort((a, b) => a.localeCompare(b));

        const citiesByState = {};

        states.forEach((stateLabel) => {
          const stateKey = toCanonicalKey(stateLabel);
          const stateEntry = stateMap.get(stateKey);
          citiesByState[stateLabel] = Array.from(stateEntry?.cities || [])
            .map((cityKey) => toDisplayLabel(cityKey))
            .sort((a, b) => a.localeCompare(b));
        });

        if (ignore) return;

        setLocationOptions({ states, citiesByState });

        if (states.length) {
          const nextState = currentLocation?.state && states.includes(currentLocation.state)
            ? currentLocation.state
            : states[0];
          const cityList = citiesByState[nextState] || [];
          const nextCity = currentLocation?.city && cityList.includes(currentLocation.city)
            ? currentLocation.city
            : cityList[0] || "All India";

          setSelectedState(nextState);
          setSelectedCity(nextCity);
        }
      } catch {
        if (!ignore) {
          setLocationOptions({ states: [], citiesByState: {} });
        }
      } finally {
        if (!ignore) {
          setIsLocationLoading(false);
        }
      }
    };

    fetchLocationOptions();
    return () => {
      ignore = true;
    };
  }, [currentLocation?.state, currentLocation?.city]);

  const visibleStates = useMemo(
    () =>
      (locationOptions.states || []).filter((state) =>
        state.toLowerCase().includes(stateSearch.trim().toLowerCase())
      ),
    [locationOptions.states, stateSearch]
  );

  const visibleCities = useMemo(() => {
    const cities = locationOptions.citiesByState?.[selectedState] || [];
    return cities.filter((city) =>
      city.toLowerCase().includes(citySearch.trim().toLowerCase())
    );
  }, [citySearch, locationOptions.citiesByState, selectedState]);

  const handleStateSelect = (state) => {
    setSelectedState(state);
    const cityList = locationOptions.citiesByState?.[state] || [];
    const defaultCity = cityList[0] || "All India";
    setSelectedCity(defaultCity);
    const nextLocation = { state, city: defaultCity };
    dispatch(setUserLocation(nextLocation));
    emitLocationUpdate(nextLocation);
    setCitySearch("");
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    const nextLocation = { state: selectedState, city };
    dispatch(setUserLocation(nextLocation));
    emitLocationUpdate(nextLocation);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to="/" className="group flex shrink-0 items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-emerald-400">CRT</span>
            </Link>

            <div className="hidden max-w-md flex-1 md:block" aria-hidden="true" style={{ display: "none" }}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearchSubmit(event.currentTarget.value);
                    }
                  }}
                  placeholder="Search events, competitions..."
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-10 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchValue("");
                      navigate("/", { replace: true });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-white md:inline-flex"
              >
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span className="max-w-[110px] truncate">{selectedCity || selectedState}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="inline-flex rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-300 transition hover:border-emerald-500/40 hover:text-white md:hidden"
                aria-label="Open location selector"
              >
                <MapPin className="h-4 w-4" />
              </button>

              <div className="relative" aria-hidden="true" style={{ display: "none" }}>
                <button
                  type="button"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative rounded-lg p-2 text-slate-400 hover:text-emerald-400"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-400 px-1 text-[9px] font-bold text-slate-950">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/60">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                      <p className="text-sm font-bold text-white">Notifications</p>
                      <button
                        type="button"
                        onClick={() => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))}
                        className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationRead(notification.id)}
                          className={`block w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-900/80 ${
                            !notification.read ? "bg-slate-900/50" : "bg-slate-950"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{notification.title}</p>
                              <p className="mt-1 text-xs text-slate-400">{notification.message}</p>
                            </div>
                            {!notification.read && (
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            )}
                          </div>
                          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            {notification.time}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {user ? (
                <Link
                  to={accountPath}
                  replace
                  className="hidden items-center justify-center rounded-full border border-emerald-500/30 bg-slate-900/80 p-1.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/10 transition hover:border-emerald-400/50 hover:bg-slate-800 sm:inline-flex"
                  aria-label="Open profile"
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-emerald-500/30 bg-slate-800">
                    {hasAvatar ? (
                      <img
                        src={avatarUrl}
                        alt={displayName || "User profile"}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          const fallback = event.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      className="flex h-full w-full items-center justify-center text-[10px] font-bold text-emerald-300"
                      style={{ display: hasAvatar ? "none" : "flex" }}
                    >
                      {avatarInitial}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link to="/login" replace className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
                    <User className="h-4 w-4" />
                    <span>User Login</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden bg-slate-950/80 backdrop-blur-sm">
          <div className="flex h-full w-full items-end justify-center p-0 md:items-center md:p-4">
            <div className="relative flex w-full max-h-[92vh] flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-800 bg-slate-900 shadow-[0_-20px_50px_rgba(2,6,23,0.8)] md:max-w-3xl md:rounded-3xl md:shadow-2xl md:shadow-slate-950/60">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-950/90 text-slate-300 shadow-lg shadow-slate-950/40 transition hover:border-emerald-500/50 hover:text-white md:h-11 md:w-11"
                aria-label="Close location modal"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 pb-3 pt-4 md:px-5 md:pt-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                    Select Location
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white md:text-xl">State & City</h3>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 touch-pan-y md:grid md:grid-cols-[1fr_1.1fr] md:p-5">
                <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Search state"
                    className="mb-3 h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  />

                  <div
                    className="min-h-0 max-h-[32vh] flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-1 md:max-h-[46vh]"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {isLocationLoading ? (
                      <p className="rounded-xl border border-dashed border-slate-700 px-3 py-5 text-center text-xs text-slate-500">
                        Loading locations...
                      </p>
                    ) : visibleStates.length > 0 ? (
                      visibleStates.map((state) => (
                        <button
                          key={state}
                          type="button"
                          onClick={() => handleStateSelect(state)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            selectedState === state
                              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                              : "text-slate-300 hover:bg-slate-800/90 hover:text-white"
                          }`}
                        >
                          <span>{state}</span>
                          {selectedState === state && <Check className="h-4 w-4" />}
                        </button>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-700 px-3 py-5 text-center text-xs text-slate-500">
                        No state found
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      City
                    </label>
                    <span className="text-[10px] text-slate-500">{selectedState}</span>
                  </div>

                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search city"
                    className="mb-3 h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  />

                  <div
                    className="min-h-0 max-h-[32vh] flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-1 md:max-h-[46vh]"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {isLocationLoading ? (
                      <p className="rounded-xl border border-dashed border-slate-700 px-3 py-5 text-center text-xs text-slate-500">
                        Loading cities...
                      </p>
                    ) : visibleCities.length > 0 ? (
                      visibleCities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          aria-pressed={selectedCity === city}
                          onClick={() => handleCitySelect(city)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            selectedCity === city
                              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]"
                              : "text-slate-300 hover:bg-slate-800/90 hover:text-white"
                          }`}
                        >
                          <span>{city}</span>
                          {selectedCity === city && <Check className="h-4 w-4" />}
                        </button>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-700 px-3 py-5 text-center text-xs text-slate-500">
                        No city found for this state
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 border-t border-slate-800 bg-slate-950/60 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:flex-row md:items-center md:justify-between md:px-5">
                <div className="flex min-w-0 items-center gap-2 text-xs text-slate-300">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">{selectedCity}, {selectedState}</span>
                </div>

                <div className="flex w-full items-center gap-2 md:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white active:scale-[0.99] md:flex-none"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextLocation = { state: selectedState, city: selectedCity };
                      dispatch(setUserLocation(nextLocation));
                      emitLocationUpdate(nextLocation);
                      setIsLocationModalOpen(false);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_12px_24px_rgba(16,185,129,0.25)] transition hover:brightness-110 active:scale-[0.99] md:flex-none"
                  >
                    Done
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;