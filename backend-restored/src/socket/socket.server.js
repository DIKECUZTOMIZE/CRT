import { Server } from "socket.io";

import config from "../config/config.js";
import { verifyAccessToken } from "../shared/utils/token.js";

let socketServerInstance = null;

const getAuthTokenFromSocket = (socket) => {
    const explicitToken = socket?.handshake?.auth?.token;
    if (typeof explicitToken === "string" && explicitToken.trim()) {
        return explicitToken.trim();
    }

    const authorizationHeader = socket?.handshake?.headers?.authorization;
    if (typeof authorizationHeader === "string" && authorizationHeader.startsWith("Bearer ")) {
        return authorizationHeader.slice("Bearer ".length).trim();
    }

    const cookieHeader = socket?.handshake?.headers?.cookie || "";
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)(?:userAccessToken|organizerAccessToken|adminAccessToken)=([^;]+)/);
    if (cookieMatch?.[1]) {
        return decodeURIComponent(cookieMatch[1]);
    }

    return null;
};

const resolveSocketUser = (socket) => {
    const token = getAuthTokenFromSocket(socket);
    if (!token) {
        return null;
    }

    try {
        const payload = verifyAccessToken(token);
        const userId = payload?.sub ? String(payload.sub) : "";
        const role = payload?.role || "USER";

        if (!userId) {
            return null;
        }

        return {
            id: userId,
            userId,
            sub: payload.sub,
            role,
            roles: Array.isArray(payload.roles) ? payload.roles : [payload.role].filter(Boolean),
        };
    } catch {
        return null;
    }
};

const setupSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: config.security.corsOrigin,
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    socketServerInstance = io;

    io.use((socket, next) => {
        const authenticatedUser = resolveSocketUser(socket);

        if (!authenticatedUser) {
            socket.user = null;
            socket.data.userId = null;
            socket.data.authenticated = false;
            return next();
        }

        socket.user = authenticatedUser;
        socket.data.userId = authenticatedUser.userId;
        socket.data.authenticated = true;
        return next();
    });

    io.on("connection", (socket) => {
        socket.on("user:join", (payload) => {
            const trustedUserId = socket.user?.userId || socket.data?.userId;
            const requestedUserId = payload && typeof payload === "object" ? payload.userId : payload;

            if (!trustedUserId) {
                return;
            }

            if (requestedUserId && String(requestedUserId) !== String(trustedUserId)) {
                return;
            }

            socket.join(`user:${String(trustedUserId)}`);
            socket.data.userId = String(trustedUserId);
        });

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
