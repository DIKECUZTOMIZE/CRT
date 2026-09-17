import test from "node:test";
import assert from "node:assert/strict";

import passport from "../../config/passport.js";
import { googleCallbackController } from "./auth.controller.js";

test("google callback disables passport session persistence", async () => {
    const originalAuthenticate = passport.authenticate;
    let capturedOptions = null;
    let capturedCallback = null;

    passport.authenticate = (strategy, options, callback) => {
        capturedOptions = options;
        capturedCallback = callback;

        assert.equal(strategy, "google");
        assert.deepEqual(options, { session: false });
        assert.equal(typeof callback, "function");

        return (req, res, next) => {
            callback(new Error("google failed"), null);
        };
    };

    try {
        let redirectUrl = "";
        const req = { query: {}, headers: {} };
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
