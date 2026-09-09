import env from "./env.js";

const allowedOrigins = String(env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const frontendUrl = env.FRONTEND_URL || allowedOrigins[0] || "http://localhost:5173";
const adminFrontendUrl = env.ADMIN_FRONTEND_URL || frontendUrl;
const organizerFrontendUrl = env.ORGANIZER_FRONTEND_URL || frontendUrl;

const isProduction = env.NODE_ENV === "production";
const hasExternalFrontend = Boolean(
    frontendUrl &&
    /^https?:\/\//i.test(frontendUrl) &&
    !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(frontendUrl)
);
const isLocalhostFrontend = Boolean(
    frontendUrl && /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(frontendUrl)
);
const isSecureCookie = isProduction && hasExternalFrontend;
const cookieSameSite = isSecureCookie ? "none" : "lax";

const config = Object.freeze({
    app: {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        frontendUrl,
        adminFrontendUrl,
        organizerFrontendUrl,
        isProduction,
        isLocalhostFrontend,
    },

    database: {
        mongoUri: env.MONGO_URI,
    },

    auth: {
        accessTokenSecret: env.ACCESS_TOKEN_SECRET,
        refreshTokenSecret: env.REFRESH_TOKEN_SECRET,

        jwt: {
            accessToken: {
                expiresIn: isProduction ? "15m" : "5m",
            },

            refreshToken: {
                expiresIn: isProduction ? "30d" : "7d",
            },
        },

        cookie: {
            user: {
                accessToken: {
                    httpOnly: true,
                    secure: isSecureCookie,
                    sameSite: cookieSameSite,
                    path: "/",
                    maxAge: isProduction ? 15 * 60 * 1000 : 5 * 60 * 1000,
                },
                refreshToken: {
                    httpOnly: true,
                    secure: isSecureCookie,
                    sameSite: cookieSameSite,
                    path: "/",
                    maxAge: isProduction
                        ? 30 * 24 * 60 * 60 * 1000
                        : 7 * 24 * 60 * 60 * 1000,
                },
            },
            organizer: {
                accessToken: {
                    httpOnly: true,
                    secure: isSecureCookie,
                    sameSite: cookieSameSite,
                    path: "/",
                    maxAge: isProduction ? 15 * 60 * 1000 : 5 * 60 * 1000,
                },
                refreshToken: {
                    httpOnly: true,
                    secure: isSecureCookie,
                    sameSite: cookieSameSite,
                    path: "/",
                    maxAge: isProduction
                        ? 30 * 24 * 60 * 60 * 1000
                        : 7 * 24 * 60 * 60 * 1000,
                },
            },
            admin: {
                accessToken: {
                    httpOnly: true,
                    secure: isSecureCookie,
                    sameSite: cookieSameSite,
                    path: "/",
                    maxAge: isProduction ? 15 * 60 * 1000 : 5 * 60 * 1000,
                },
                refreshToken: {
                    httpOnly: true,
                    secure: isSecureCookie,
                    sameSite: cookieSameSite,
                    path: "/",
                    maxAge: isProduction
                        ? 30 * 24 * 60 * 60 * 1000
                        : 7 * 24 * 60 * 60 * 1000,
                },
            },
            accessToken: {
                httpOnly: true,
                secure: isSecureCookie,
                sameSite: cookieSameSite,
                path: "/",
                maxAge: isProduction ? 15 * 60 * 1000 : 5 * 60 * 1000,
            },
            refreshToken: {
                httpOnly: true,
                secure: isSecureCookie,
                sameSite: cookieSameSite,
                path: "/",
                maxAge: isProduction
                    ? 30 * 24 * 60 * 60 * 1000
                    : 7 * 24 * 60 * 60 * 1000,
            },
        },
    },

    security: {
        corsOrigin: env.CORS_ORIGIN,
        allowedOrigins,
        rateLimit: {
            windowMs: env.RATELIMIT_WINDOW_MS,
            limit: env.RATELIMIT,
        },
    },

    logger: {
        level: env.LOGGER_LEVEL,
    },

    google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackUrl: env.GOOGLE_CALLBACK_URL,
    },

    cloudinary: {
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
    },

    email: {
        smtpHost: env.SMTP_HOST,
        smtpPort: env.SMTP_PORT,
        smtpSecure: env.SMTP_SECURE,
        smtpUser: env.SMTP_USER,
        smtpPass: env.SMTP_PASS,
        smtpFrom: env.SMTP_FROM,
    },
});

export default config;