import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import passport from "../../config/passport.js";
import config from "../../config/config.js";
import UserModel from "../../model/user.model.js";
import { googleCallbackController, resolvePortalCookieRole } from "./auth.controller.js";
import { registerUserService } from "./auth.service.js";
import { createGoogleOAuthState, OAUTH_PORTALS } from "./oauth.state.js";

before(async () => {
    const mongoUri = "mongodb://localhost:27017/CRT";

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    await mongoose.connection.asPromise();
});

after(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
});

test("google callback disables passport session persistence", async () => {
    const originalAuthenticate = passport.authenticate;
    let capturedOptions = null;
    let capturedCallback = null;
    const state = await createGoogleOAuthState(OAUTH_PORTALS.USER);

    passport.authenticate = (strategy, options, callback) => {
        capturedOptions = options;
        capturedCallback = callback;

        assert.equal(strategy, "google");
        assert.equal(options.session, false);
        assert.equal(typeof callback, "function");

        return (req, res, next) => {
            callback(new Error("google failed"), null);
        };
    };

    try {
        let redirectUrl = "";
        const req = { query: { state }, headers: {} };
        const res = {
            redirect: (url) => {
                redirectUrl = url;
                return res;
            },
        };

        await googleCallbackController(req, res, () => {});

        assert.ok(capturedOptions);
        assert.equal(capturedOptions.session, false);
        assert.match(redirectUrl, /\/login\?error=google_auth_failed$/);
    } finally {
        passport.authenticate = originalAuthenticate;
    }
});

test("user callback without portal query param follows the state-bound user portal", async () => {
    const originalAuthenticate = passport.authenticate;
    const originalGoogleLoginService = globalThis.__CRT_GOOGLE_LOGIN_SERVICE;
    const state = await createGoogleOAuthState(OAUTH_PORTALS.USER);

    globalThis.__CRT_GOOGLE_LOGIN_SERVICE = async () => ({
        accessToken: "user-access-token",
        refreshToken: "user-refresh-token",
    });

    passport.authenticate = (strategy, options, callback) => {
        assert.equal(strategy, "google");
        assert.equal(options.session, false);
        return (req, res, next) => {
            req.googleOAuthStateValidation = { valid: true, portal: OAUTH_PORTALS.USER };
            callback(null, {
                _id: "user-google-1",
                role: "USER",
                roles: ["USER"],
                email: "state-user@example.com",
                fullName: "State User",
                phone: "",
                address: "",
                organizationName: "",
                website: "",
                bio: "",
            });
        };
    };

    try {
        let redirectUrl = "";
        const req = { query: { state }, headers: {} };
        const res = {
            redirect: (url) => {
                redirectUrl = url;
                return res;
            },
            clearCookie: () => {},
            cookie: () => {},
        };

        await googleCallbackController(req, res, () => {});
        assert.match(redirectUrl, /\/profile$/);
    } finally {
        passport.authenticate = originalAuthenticate;
        if (typeof originalGoogleLoginService === "undefined") {
            delete globalThis.__CRT_GOOGLE_LOGIN_SERVICE;
        } else {
            globalThis.__CRT_GOOGLE_LOGIN_SERVICE = originalGoogleLoginService;
        }
    }
});

test("organizer callback without portal query param follows the state-bound organizer portal", async () => {
    const originalAuthenticate = passport.authenticate;
    const originalGoogleLoginService = globalThis.__CRT_GOOGLE_LOGIN_SERVICE;
    const state = await createGoogleOAuthState(OAUTH_PORTALS.ORGANIZER);

    globalThis.__CRT_GOOGLE_LOGIN_SERVICE = async () => ({
        accessToken: "organizer-access-token",
        refreshToken: "organizer-refresh-token",
    });

    passport.authenticate = (strategy, options, callback) => {
        assert.equal(strategy, "google");
        assert.equal(options.session, false);
        return (req, res, next) => {
            req.googleOAuthStateValidation = { valid: true, portal: OAUTH_PORTALS.ORGANIZER };
            callback(null, {
                _id: "organizer-google-1",
                role: "ORGANIZER",
                roles: ["ORGANIZER"],
                email: "state-organizer@example.com",
                fullName: "State Organizer",
                phone: "",
                address: "",
                organizationName: "",
                website: "",
                bio: "",
            });
        };
    };

    try {
        let redirectUrl = "";
        const req = { query: { state }, headers: {} };
        const res = {
            redirect: (url) => {
                redirectUrl = url;
                return res;
            },
            clearCookie: () => {},
            cookie: () => {},
        };

        await googleCallbackController(req, res, () => {});
        assert.match(redirectUrl, /\/organizer\/dashboard$/);
    } finally {
        passport.authenticate = originalAuthenticate;
        if (typeof originalGoogleLoginService === "undefined") {
            delete globalThis.__CRT_GOOGLE_LOGIN_SERVICE;
        } else {
            globalThis.__CRT_GOOGLE_LOGIN_SERVICE = originalGoogleLoginService;
        }
    }
});

test("mixed-role owner login resolves to organizer cookies when the organizer portal initiates login", () => {
    const req = {
        headers: { origin: "http://localhost:5175" },
        body: { email: "organizer@crt.com", password: "Organizer@123456" },
    };

    assert.equal(resolvePortalCookieRole(req, "USER"), "ORGANIZER");
    assert.equal(resolvePortalCookieRole(req, "ORGANIZER"), "ORGANIZER");
});

test("user portal login stays on user cookies even for mixed-role accounts", () => {
    const req = {
        headers: { origin: "http://localhost:5173" },
        body: { email: "organizer@crt.com", password: "Organizer@123456" },
    };

    assert.equal(resolvePortalCookieRole(req, "USER"), "USER");
});

test("user login without an explicit portal keeps USER cookies even for mixed-role accounts", () => {
    const req = {
        headers: {},
        body: { email: "organizer@crt.com", password: "Organizer@123456" },
    };

    assert.equal(resolvePortalCookieRole(req, "USER"), "USER");
    assert.equal(resolvePortalCookieRole(req, "ORGANIZER"), "USER");
});

test("mixed-role organizer registration keeps ORGANIZER in the JWT role list", async () => {
    const email = `mixed-role-${Date.now()}@example.com`;
    const result = await registerUserService(
        { username: `mixed-role-${Date.now()}`, email, password: "StrongPass!123" },
        "USER",
        ["USER", "ORGANIZER"]
    );

    const payload = jwt.verify(result.accessToken, config.auth.accessTokenSecret);

    assert.deepEqual(payload.roles, ["USER", "ORGANIZER"]);
    assert.equal(payload.role, "USER");
    assert.ok(payload.roles.includes("ORGANIZER"));
});

test("organizer callback without portal query param rejects a plain-user Google account with an organizer access error", async () => {
    const originalAuthenticate = passport.authenticate;
    const originalGoogleLoginService = globalThis.__CRT_GOOGLE_LOGIN_SERVICE;
    const state = await createGoogleOAuthState(OAUTH_PORTALS.ORGANIZER);

    globalThis.__CRT_GOOGLE_LOGIN_SERVICE = async () => ({
        accessToken: "organizer-access-token",
        refreshToken: "organizer-refresh-token",
    });

    passport.authenticate = (strategy, options, callback) => {
        assert.equal(strategy, "google");
        assert.equal(options.session, false);
        return (req, res, next) => {
            req.googleOAuthStateValidation = { valid: true, portal: OAUTH_PORTALS.ORGANIZER };
            callback(null, {
                _id: "plain-user-google-1",
                role: "USER",
                roles: ["USER"],
                email: "plain-google-organizer@example.com",
                fullName: "Plain Google User",
                phone: "",
                address: "",
                organizationName: "",
                website: "",
                bio: "",
            });
        };
    };

    try {
        let redirectUrl = "";
        const req = { query: { state }, headers: {} };
        const res = {
            redirect: (url) => {
                redirectUrl = url;
                return res;
            },
            clearCookie: () => {},
            cookie: () => {},
        };

        await googleCallbackController(req, res, () => {});
        assert.match(redirectUrl, /\/organizer\/login\?error=organizer_access_required$/);
    } finally {
        passport.authenticate = originalAuthenticate;
        if (typeof originalGoogleLoginService === "undefined") {
            delete globalThis.__CRT_GOOGLE_LOGIN_SERVICE;
        } else {
            globalThis.__CRT_GOOGLE_LOGIN_SERVICE = originalGoogleLoginService;
        }
    }
});

test("plain Google user creation does not auto-grant organizer access", async () => {
    const UserModel = (await import("../../model/user.model.js")).default;
    const originalCreate = UserModel.create;
    let capturedPayload = null;

    UserModel.create = async (payload) => {
        capturedPayload = payload;
        return {
            ...payload,
            _id: "google-user-1",
            toObject: () => ({ ...payload, _id: "google-user-1" }),
            save: async function () { return this; },
        };
    };

    try {
        const { createUser } = await import("../../dao/user.dao.js");
        await createUser({
            username: "plain-google-user",
            email: "plain-google-user@example.com",
            password: "",
            role: "USER",
            roles: ["USER"],
            googleId: "google-user-id-123",
            fullName: "Plain Google User",
            avatar: "",
        });

        assert.deepEqual(capturedPayload.roles, ["USER"]);
        assert.equal(capturedPayload.role, "USER");
        assert.ok(!capturedPayload.roles.includes("ORGANIZER"));
    } finally {
        UserModel.create = originalCreate;
    }
});
