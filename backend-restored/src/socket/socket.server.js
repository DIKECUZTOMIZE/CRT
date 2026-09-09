import { Server } from "socket.io";

import config from "../config/config.js";

let socketServerInstance = null;

const setupSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: config.security.corsOrigin,
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    socketServerInstance = io;

    io.on("connection", (socket) => {
        socket.on("user:location-updated", (payload) => {
            if (!payload || typeof payload !== "object") {
                return;
            }

            const state = payload.state || "India";
            const city = payload.city || "All India";

            if (!state && !city) {
                return;
            }

            io.emit("user:location-updated", {
                state,
                city,
                updatedAt: Date.now(),
            });
        });

        socket.on("disconnect", () => {});
    });

    return io;
};

export const getSocketServer = () => socketServerInstance;

export default setupSocket;
