import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Skeleton } from "../ui/Skeleton";

const isKnownBrokenUploadUrl = (value) => {
  if (!value) return false;

  const normalized = String(value).trim();
  return /(?:^|\/)(?:uploads\/)?(?:banner_|test-banner-)[^\s"'<>]+\.(?:avif|jpg|jpeg|png|webp|gif)/i.test(normalized);
};

const normalizeImageSource = (value, fallback) => {
  if (!value) return fallback;

  const normalizedValue = String(value).trim();
  if (isKnownBrokenUploadUrl(normalizedValue)) {
    return fallback;
  }

  if (normalizedValue.startsWith("http://") || normalizedValue.startsWith("https://")) {
    return normalizedValue;
  }

  const baseUrl = (import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? `${window.location.origin}`.replace(/:\d+$/, ":3000") : "http://localhost:3000")).replace(/\/$/, "");
  const basePath = normalizedValue.startsWith("/") ? normalizedValue : `/${normalizedValue}`;

  return `${baseUrl}${basePath}`;
};

export const ImageWithFallback = ({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  aspectRatio = "aspect-video",
  fallbackSrc,
  loading = "eager",
  ...props
}) => {
  const location = useLocation();
  const defaultFallback =
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80";
  const nextFallback = fallbackSrc || defaultFallback;
  const normalizedInitialSrc = useMemo(
    () => normalizeImageSource(src, nextFallback),
    [src, nextFallback]
  );
  const [currentSrc, setCurrentSrc] = useState(normalizedInitialSrc);
  const [renderVersion, setRenderVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(normalizedInitialSrc) && normalizedInitialSrc !== nextFallback);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextImage = normalizeImageSource(src, nextFallback);
    setCurrentSrc(nextImage);
    setHasError(false);
    setIsLoading(Boolean(nextImage) && nextImage !== nextFallback);
    setRenderVersion((previous) => previous + 1);
  }, [src, nextFallback, location.pathname]);

  const handleImageError = () => {
    setIsLoading(false);

    if (currentSrc !== nextFallback) {
      setCurrentSrc(nextFallback);
      setHasError(false);
      return;
    }

    setHasError(true);
  };

  const mountKey = `img-${location.pathname}-${currentSrc}-${renderVersion}`;
  const resolvedSrc = currentSrc.includes("?") ? `${currentSrc}&v=${renderVersion}` : `${currentSrc}?v=${renderVersion}`;

  return (
    <div
      className={`relative overflow-hidden ${aspectRatio} ${containerClassName}`}
    >
      {isLoading && !hasError && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}

      {hasError ? (
        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center border border-slate-800 bg-slate-900/80 p-2 text-center text-slate-500">
          <svg
            className="mb-1 h-6 w-6 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-[10px]">Image Unavailable</span>
        </div>
      ) : (
        <img
          key={mountKey}
          src={resolvedSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={loading === "eager" ? "high" : undefined}
          onLoad={() => setIsLoading(false)}
          onError={handleImageError}
          className={`h-full w-full object-cover transition-opacity duration-200 ${
            isLoading ? "opacity-0" : "opacity-100"
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
};
