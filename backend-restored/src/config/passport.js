import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";

import env from "./env.js";
import * as userDao from "../dao/user.dao.js";
import { ROLES } from "../constant/model.constant.js";
import {
    OAUTH_PORTALS,
    validateGoogleOAuthState,
} from "../module/auth/oauth.state.js";

const buildGoogleUsername = (profile, email) => {
    const base = String(
        profile?.displayName ||
        profile?.name?.givenName ||
        profile?.name?.familyName ||
        email.split("@")[0] ||
        "google-user"
    )
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .toLowerCase();

    return `${base || "google-user"}${Date.now()}`.slice(0, 32);
};

passport.serializeUser((user, done) => {
    done(null, user?._id || user?.id || null);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userDao.getUserById(id);
        done(null, user || null);
    } catch (error) {
        done(error, null);
    }
});

passport.use(
    new GoogleStrategy(
        {
            clientID: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            callbackURL: env.GOOGLE_CALLBACK_URL,
            scope: ["profile", "email"],
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                let stateValidation = req?.googleOAuthStateValidation || null;

                if (!stateValidation) {
                    stateValidation = await validateGoogleOAuthState(req?.query?.state ?? "");
                }

                if (!stateValidation.valid) {
                    return done(new Error(stateValidation.reason || "Invalid OAuth state"), null);
                }

                const portal = stateValidation.portal;
                const email = String(profile?.emails?.[0]?.value || "").trim().toLowerCase();

                if (!email) {
                    return done(new Error("Google account email is required"), null);
                }

                let user = await userDao.getUserByGoogleId(profile.id);

                if (!user) {
                    user = await userDao.getUserByEmailOrUsername({ email });
                }

                if (portal === OAUTH_PORTALS.ORGANIZER) {
                    const roles = Array.isArray(user?.roles) ? user.roles : [];
                    const normalizedRole = String(user?.role ?? "").trim().toUpperCase();
                    const normalizedRoles = roles.map((role) => String(role ?? "").trim().toUpperCase());

                    if (!user) {
                        return done(new Error("Organizer access required"), null);
                    }

                    if (normalizedRole === "ADMIN" || normalizedRoles.includes("ADMIN")) {
                        return done(new Error("Admin accounts cannot use Google OAuth"), null);
                    }

                    if (normalizedRole !== "ORGANIZER" && !normalizedRoles.includes("ORGANIZER")) {
                        return done(new Error("Organizer access required"), null);
                    }
                }

                if (user && String(user.role ?? "").trim().toUpperCase() === "ADMIN") {
                    return done(new Error("Admin accounts cannot use Google OAuth"), null);
                }

                if (!user) {
                    if (portal === OAUTH_PORTALS.USER) {
                        user = await userDao.createUser({
                            username: buildGoogleUsername(profile, email),
                            email,
                            password: "",
                            role: ROLES.USER,
                            roles: [ROLES.USER, ROLES.ORGANIZER],
                            googleId: profile.id,
                            fullName: profile.displayName || "Google User",
                            avatar: profile.photos?.[0]?.value || "",
                        });
                    } else {
                        return done(new Error("Organizer access required"), null);
                    }
                }

                if (user && user.googleId && user.googleId !== profile.id) {
                    return done(new Error("This Google account is already linked to another user"), null);
                }

                const nextRoles = [...new Set([
                    ...(Array.isArray(user.roles) ? user.roles : []),
                    user.role,
                    ROLES.USER,
                    ROLES.ORGANIZER,
                ])].map((entry) => String(entry ?? "").trim().toUpperCase()).filter((entry) => entry && Object.values(ROLES).includes(entry));

                if (!user.role || !Object.values(ROLES).includes(String(user.role ?? "").trim().toUpperCase())) {
                    user.role = ROLES.USER;
                }

                if (user.role === ROLES.ADMIN) {
                    return done(new Error("Admin accounts cannot use Google OAuth"), null);
                }

                user.roles = nextRoles;
                if (!user.googleId) {
                    user.googleId = profile.id;
                }

                if (!user.avatar && profile.photos?.[0]?.value) {
                    user.avatar = profile.photos[0].value;
                }

                await user.save();

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;
