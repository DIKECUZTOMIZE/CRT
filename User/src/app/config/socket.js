import { io } from "socket.io-client";

const DEFAULT_SOCKET_URL = "https://api.crtcompete.com";
const SOCKET_URL = import.meta.env.VITE_API_URL || (
  typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? window.location.origin.replace(/:\d+$/, ":3000")
    : DEFAULT_SOCKET_URL
);

const hasAuthCookie = () => {
  if (typeof document === "undefined") {
    return false;
  }

  return /(?:^|;\s*)(userAccessToken|organizerAccessToken|adminAccessToken)=/.test(document.cookie);
};

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: false,
  reconnectionAttempts: 0,
  reconnectionDelay: 0,
  timeout: 3000,
  autoConnect: hasAuthCookie(),
});

export const connectSocketIfAuthenticated = () => {
  if (!hasAuthCookie()) {
    if (socket.connected) {
      socket.disconnect();
    }
    return false;
  }

  if (!socket.connected) {
    socket.connect();
  }

  return true;
};

export const joinUserRoom = () => {
  if (!socket?.connected) {
    return;
  }

  socket.emit("user:join", {});
};

export const emitLocationUpdate = (location) => {
  if (!location || typeof location !== "object") return;

  const payload = {
    state: location.state || "India",
    city: location.city || "All India",
    updatedAt: Date.now(),
  };

  if (socket?.connected) {
    socket.emit("user:location-updated", payload);
  }
};

export const listenToLocationUpdates = (callback) => {
  if (typeof callback !== "function") {
    return () => {};
  }

  const handler = (payload) => callback(payload);
  socket.on("user:location-updated", handler);

  return () => {
    socket.off("user:location-updated", handler);
  };
};

export const listenToEventUpdates = (eventId, callback) => {
  if (!eventId || typeof callback !== "function") {
    return () => {};
  }

  const handler = (payload) => {
    if (!payload || !payload.eventId || String(payload.eventId) !== String(eventId)) {
      return;
    }

    callback(payload);
  };

  socket.on("event:updated", handler);

  return () => {
    socket.off("event:updated", handler);
  };
};

export const listenToNotifications = (callback) => {
  if (typeof callback !== "function") {
    return () => {};
  }

  const handler = (payload) => callback(payload);
  socket.on("notifications:updated", handler);

  return () => {
    socket.off("notifications:updated", handler);
  };
};
