const normalizeNotificationValue = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return "";
  }

  const lower = normalized.toLowerCase();
  if (lower === "undefined" || lower === "null") {
    return "";
  }

  return normalized;
};

const normalizeEventPath = (value) => {
  const normalized = normalizeNotificationValue(value);
  if (!normalized) {
    return null;
  }

  let candidate = normalized;
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    try {
      const url = new URL(candidate);
      candidate = url.pathname;
    } catch {
      return null;
    }
  }

  const withoutHash = candidate.split(/[?#]/, 1)[0];
  const eventPath = withoutHash.startsWith("/") ? withoutHash : `/${withoutHash}`;

  if (!/^\/events\/([a-fA-F0-9]{12,24})$/i.test(eventPath)) {
    return null;
  }

  return eventPath;
};

export const resolveNotificationTargetPath = (notification) => {
  if (!notification || typeof notification !== "object") {
    return null;
  }

  const raw = notification.raw || notification;
  const metadata = notification.metadata || raw?.metadata || {};

  const linkCandidates = [
    notification.link,
    raw?.link,
    metadata.link,
    raw?.url,
    metadata.url,
  ];

  for (const candidate of linkCandidates) {
    const resolvedPath = normalizeEventPath(candidate);
    if (resolvedPath) {
      return resolvedPath;
    }
  }

  const eventId = [
    metadata.eventId,
    raw?.eventId,
    raw?.event_id,
    metadata.id,
    raw?.id,
  ]
    .map((value) => normalizeNotificationValue(value))
    .find((value) => /^[a-fA-F0-9]{12,24}$/.test(value));

  if (eventId) {
    return `/events/${eventId}`;
  }

  return null;
};
