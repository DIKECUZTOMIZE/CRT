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
  const heroTitle = typeof currentSlide?.title === "string" ? currentSlide.title.trim() : "";
  const shouldShowHeroTitle = !!heroTitle && heroTitle !== "Untitled Slide";

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
    <section className="relative w-full pb-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8">
        <div className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.08)_0%,rgba(255,255,255,0)_100%),#FFFFFF] shadow-[0_10px_26px_rgba(15,118,110,0.05)] backdrop-blur-xl">
          <div className="border-b border-emerald-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(236,253,245,0.60))] p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600/80 sm:h-4 sm:w-4" />
                <input
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search competitions, locations..."
                  className="hero-search-input h-10 w-full rounded-full border border-emerald-100 bg-white pl-11 pr-4 text-[14px] text-slate-900 caret-slate-900 placeholder:text-slate-500/60 outline-none transition focus:border-emerald-200 focus:ring-2 focus:ring-emerald-100 sm:h-12 sm:rounded-2xl sm:bg-white sm:text-[14px] sm:text-slate-900 sm:placeholder:text-slate-500"
                  style={{
                    backgroundColor: "#fff",
                    color: "#0f172a",
                    caretColor: "#0f172a",
                    fontSize: "14px",
                    lineHeight: "1.25",
                  }}
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:max-w-[58%]">
                <div className="flex h-10 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-[#F4F9F6] px-2.5 text-emerald-700 shadow-[inset_0_1px_0_rgba(16,185,129,0.06)]">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>

                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => onFilterChange(filter.id === activeFilter ? null : filter.id)}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 sm:text-[11px] ${
                      filter.id === "in-person" ? "hidden sm:inline-flex" : ""
                    } ${
                      activeFilter === filter.id
                        ? "bg-[#059669] text-white shadow-[0_1px_3px_rgba(6,78,59,0.10)]"
                        : "bg-[#F8FBF9] text-slate-600 hover:bg-[#ECFDF5] hover:text-emerald-700"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-0 overflow-hidden bg-white shadow-[inset_0_1px_0_rgba(148,163,184,0.12)]">
            <div className="relative h-[198px] overflow-hidden rounded-[16px] sm:h-[290px] sm:rounded-none lg:h-[380px]">
              <img
                src={slideImage}
                alt={currentSlide.title || "Hero poster"}
                className="h-full w-full rounded-[16px] object-cover sm:rounded-none"
              />

              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.20)_0%,rgba(15,23,42,0.08)_45%,rgba(15,23,42,0.02)_100%)] sm:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.12)_0%,rgba(255,255,255,0)_100%),linear-gradient(90deg,rgba(5,150,105,0.62)_0%,rgba(16,185,129,0.30)_38%,rgba(15,23,42,0.14)_100%)]" />

              <div className="absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-3 sm:inset-x-4 sm:bottom-4">
                <div className="max-w-[70%] rounded-2xl border border-white/20 bg-emerald-950/20 px-3 py-2 backdrop-blur-sm sm:px-4">
                  {shouldShowHeroTitle ? (
                    <h1 className="mt-1 line-clamp-2 text-[16px] font-bold leading-[1.25] tracking-[-0.01em] text-white sm:text-xl sm:leading-tight">
                      {heroTitle}
                    </h1>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToSlide("prev")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-emerald-950/20 text-white shadow-[0_1px_3px_rgba(6,78,59,0.10)] transition hover:bg-emerald-950/30"
                    aria-label="Previous poster"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToSlide("next")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-emerald-950/20 text-white shadow-[0_1px_3px_rgba(6,78,59,0.10)] transition hover:bg-emerald-950/30"
                    aria-label="Next poster"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
