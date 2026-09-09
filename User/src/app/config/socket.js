import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: false,
  reconnectionAttempts: 0,
  reconnectionDelay: 0,
  timeout: 3000,
  autoConnect: true,
});

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
