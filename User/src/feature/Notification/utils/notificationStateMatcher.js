const normalizeMatchValue = (value = "") => String(value ?? "").replace(/\s+/g, " ").trim();

export const matchesSelectedState = (notification = {}, selectedState = "") => {
  const targetState = normalizeMatchValue(selectedState).toLowerCase();

  if (!targetState || targetState === "india") {
    return true;
  }

  const metadata = notification?.metadata && typeof notification.metadata === "object"
    ? notification.metadata
    : {};

  const rawNotification = notification?.raw && typeof notification.raw === "object" ? notification.raw : {};
  const rawMetadata = rawNotification?.metadata && typeof rawNotification.metadata === "object" ? rawNotification.metadata : {};

  const sources = [
    metadata.state,
    metadata.locationState,
    metadata.city,
    metadata.locationCity,
    metadata.location,
    rawMetadata.state,
    rawMetadata.locationState,
    rawMetadata.city,
    rawMetadata.locationCity,
    rawMetadata.location,
    notification?.state,
    notification?.locationState,
    notification?.city,
    notification?.locationCity,
    notification?.location,
    notification?.title,
    notification?.message,
    rawNotification?.state,
    rawNotification?.locationState,
    rawNotification?.city,
    rawNotification?.locationCity,
    rawNotification?.location,
  ];

  return sources.some((value) => {
    const normalizedValue = normalizeMatchValue(value).toLowerCase();
    if (!normalizedValue) {
      return false;
    }

    return normalizedValue.includes(targetState) || targetState.includes(normalizedValue);
  });
};
