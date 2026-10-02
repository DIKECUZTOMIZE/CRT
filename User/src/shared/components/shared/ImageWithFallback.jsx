import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Skeleton } from "../ui/Skeleton";

const isKnownBrokenUploadUrl = (value) => {
  if (!value) return false;

  const normalized = String(value).trim();
  return /(?:^|\/)(?:uploads\/)?(?:banner_|test-banner-)[^\s"'<>]+\.(?:avif|jpg|jpeg|png|webp|gif)/i.test(normalized);
};

const normalizeImageSource = (value) => {
  if (!value) return "";

  const normalizedValue = String(value).trim();
  if (!normalizedValue) return "";

  if (isKnownBrokenUploadUrl(normalizedValue)) {
    return "";
  }

  if (normalizedValue.startsWith("http://") || normalizedValue.startsWith("https://")) {
    return normalizedValue;
  }

  const defaultBaseUrl = (() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname || "";
      if (["localhost", "127.0.0.1"].includes(hostname)) {
        return `${window.location.origin}`.replace(/:\d+$/, ":3000");
      }
    }

    return "https://api.crtcompete.com";
  })();

  const baseUrl = (import.meta.env.VITE_API_URL || defaultBaseUrl).replace(/\/$/, "");
  const basePath = normalizedValue.startsWith("/") ? normalizedValue : `/${normalizedValue}`;

  return `${baseUrl}${basePath}`;
};

export const ImageWithFallback = ({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  aspectRatio = "aspect-video",
  loading = "eager",
  ...props
}) => {
  const location = useLocation();
  const normalizedInitialSrc = useMemo(
    () => normalizeImageSource(src),
    [src]
  );
  const [currentSrc, setCurrentSrc] = useState(normalizedInitialSrc);
  const [renderVersion, setRenderVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(normalizedInitialSrc));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextImage = normalizeImageSource(src);
    setCurrentSrc(nextImage);
    setHasError(false);
    setIsLoading(Boolean(nextImage));
    setRenderVersion((previous) => previous + 1);
  }, [src, location.pathname]);

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!currentSrc || hasError) return null;

  const mountKey = `img-${location.pathname}-${currentSrc}-${renderVersion}`;
  const resolvedSrc = currentSrc.includes("?") ? `${currentSrc}&v=${renderVersion}` : `${currentSrc}?v=${renderVersion}`;

  return (
    <div
      className={`relative overflow-hidden ${aspectRatio} ${containerClassName}`}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}

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
    </div>
  );
};
