import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";

import env from "./env.js";
import * as userDao from "../dao/user.dao.js";
import { ROLES } from "../constant/model.constant.js";

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
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = String(profile?.emails?.[0]?.value || "").trim().toLowerCase();

                if (!email) {
                    return done(new Error("Google account email is required"), null);
                }

                let user = await userDao.getUserByGoogleId(profile.id);

                if (!user) {
                    user = await userDao.getUserByEmailOrUsername({ email });
                }

                if (!user) {
                    user = await userDao.createUser({
                        username: buildGoogleUsername(profile, email),
                        email,
                        password: "",
                        role: ROLES.USER,
                        googleId: profile.id,
                        fullName: profile.displayName || "Google User",
                        avatar: profile.photos?.[0]?.value || "",
                    });
                }

                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                }

                if (!user.avatar && profile.photos?.[0]?.value) {
                    user.avatar = profile.photos[0].value;
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;
