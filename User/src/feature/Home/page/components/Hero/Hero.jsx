import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";

const isKnownBrokenUploadUrl = (value) => {
  if (!value) return false;

  const normalized = String(value).trim();
  return /(?:^|\/)(?:uploads\/)?(?:banner_|test-banner-)[^\s"'<>]+\.(?:avif|jpg|jpeg|png|webp|gif)/i.test(normalized);
};

const Hero = ({
  searchQuery = "",
  onSearchChange = () => {},
  activeFilter = null,
  onFilterChange = () => {},
  slides = [],
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const safeSlides = useMemo(
    () =>
      Array.isArray(slides)
        ? slides.filter((slide) => slide && (slide.image || slide.images?.length))
        : [],
    [slides]
  );

  useEffect(() => {
    if (!safeSlides.length) return;

    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % safeSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [safeSlides.length]);

  if (!safeSlides.length) {
    return null;
  }

  const currentSlide = safeSlides[activeSlide] || safeSlides[0];
  const rawSlideImage = currentSlide.images?.length ? currentSlide.images[0] : currentSlide.image;
  const slideImage = isKnownBrokenUploadUrl(rawSlideImage)
    ? "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80"
    : rawSlideImage;

  const filters = [
    { id: "all", label: "All" },
    { id: "online", label: "Online" },
    { id: "in-person", label: "In Person" },
    { id: "free", label: "Free" },
    { id: "upcoming", label: "Upcoming" },
    { id: "budget", label: "Budget" },
    { id: "premium", label: "Premium" },
  ];

  const goToSlide = (direction) => {
    setActiveSlide((current) => {
      if (direction === "next") return (current + 1) % safeSlides.length;
      return (current - 1 + safeSlides.length) % safeSlides.length;
    });
  };

  return (
    <section className="relative w-full pb-6 pt-5">
      <div className="mb-6 border-b border-slate-800 bg-slate-950/70 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search events, locations, or topics"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-300">
              <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            </div>

            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id === activeFilter ? null : filter.id)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  activeFilter === filter.id
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-2 overflow-hidden bg-slate-900 shadow-2xl shadow-emerald-500/5">
        <div className="relative h-[240px] sm:h-[300px] lg:h-[380px]">
          <img
            src={slideImage}
            alt={currentSlide.title || "Hero poster"}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/30 to-transparent" />

          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button
              type="button"
              onClick={() => goToSlide("prev")}
              className="rounded-full border border-white/10 bg-slate-950/50 p-2 text-white transition hover:bg-slate-950/80"
              aria-label="Previous poster"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToSlide("next")}
              className="rounded-full border border-white/10 bg-slate-950/50 p-2 text-white transition hover:bg-slate-950/80"
              aria-label="Next poster"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
