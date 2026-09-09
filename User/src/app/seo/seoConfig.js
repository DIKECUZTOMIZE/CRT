import { SITE_URL, DEFAULT_OG_IMAGE } from "./seoUtils.js";

export const siteUrl = SITE_URL;

export const defaultSeo = {
  title: "CRT | Discover Events, Competitions & Experiences",
  description:
    "Discover upcoming events, competitions, and experiences on CRT. Explore trending events near you and book your next memorable experience.",
  keywords:
    "CRT events, competitions, online events, local events, trending experiences, event booking, event discovery",
  canonical: `${siteUrl}/`,
  image: DEFAULT_OG_IMAGE,
  type: "website",
  robots: "index,follow",
};

export const routeSeo = {
  "/": {
    title: "CRT | Discover Events, Competitions & Experiences",
    description:
      "Find the best events, competitions, and experiences near you on CRT. Explore trending activities, premium events, and community favorites.",
    keywords:
      "CRT events, competitions, event discovery, local experiences, event booking, online events",
    canonical: `${siteUrl}/`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    robots: "index,follow",
  },
  "/about": {
    title: "About CRT | Event Platform",
    description:
      "Learn about CRT and how we bring people together through unforgettable events, competitions, and local experiences.",
    keywords: "about CRT, event platform, community events, competitions, event discovery",
    canonical: `${siteUrl}/about`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    robots: "index,follow",
  },
  "/filter": {
    title: "Find Events | CRT",
    description:
      "Search and filter events by category, location, budget, and popularity to discover the perfect event for you.",
    keywords: "find events, event filter, competitions, event search, event categories, local events",
    canonical: `${siteUrl}/filter`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    robots: "index,follow",
  },
  "/login": {
    title: "Login to CRT",
    description: "Access your account and continue exploring events, saved favorites, and personalized recommendations.",
    keywords: "CRT login, event account, save events, personalized events",
    canonical: `${siteUrl}/login`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    robots: "noindex,follow",
  },
  "/register": {
    title: "Create Your CRT Account",
    description: "Join CRT to discover events, save favorites, and manage your next experience with ease.",
    keywords: "join CRT, create account, event platform signup",
    canonical: `${siteUrl}/register`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    robots: "noindex,follow",
  },
  "/profile": {
    title: "My Profile | CRT",
    description: "Manage your CRT profile, saved events, and personal preferences in one place.",
    keywords: "CRT profile, saved events, event preferences, account management",
    canonical: `${siteUrl}/profile`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    robots: "noindex,follow",
  },
  "/user-profile": {
    title: "My Profile | CRT",
    description: "Manage your CRT profile, saved events, and personal preferences in one place.",
    keywords: "CRT profile, saved events, event preferences, account management",
    canonical: `${siteUrl}/user-profile`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
    robots: "noindex,follow",
  },
};

export const buildEventSeo = (event, pathname) => {
  const eventTitle = String(event?.title || "Event Details").trim();
  const eventDescription = String(
    event?.description?.about ||
      event?.description?.tagline ||
      event?.tagline ||
      "Discover this event on CRT and explore details, schedule, prizes, and registration information.",
  ).trim();
  const eventKeywords = [
    eventTitle,
    event?.category,
    event?.mode,
    event?.location,
    "CRT",
    "event booking",
    "competition",
  ]
    .filter(Boolean)
    .join(", ");

  const canonical = `${siteUrl}${pathname || "/events"}`;

  return {
    title: `${eventTitle} | CRT Events`,
    description: eventDescription.slice(0, 160),
    keywords: eventKeywords,
    canonical,
    image: event?.bannerUrl || DEFAULT_OG_IMAGE,
    type: "article",
    robots: "index,follow",
  };
};

export const getRouteSeo = (pathname) => {
  const normalizedPath = pathname && pathname !== "/" ? pathname.split("?")[0].split("#")[0] : "/";

  if (normalizedPath.startsWith("/events/")) {
    return {
      title: "Event Details | CRT",
      description: "Explore event details, schedule, pricing, location, and registration information on CRT.",
      keywords: "event details, CRT events, competition details, local events, event booking",
      canonical: `${siteUrl}${normalizedPath}`,
      image: DEFAULT_OG_IMAGE,
      type: "article",
      robots: "index,follow",
    };
  }

  return routeSeo[normalizedPath] || defaultSeo;
};
