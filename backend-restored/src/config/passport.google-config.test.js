import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const baseEnv = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    NODE_ENV: "test",
    MONGO_URI: "mongodb://localhost:27017/CRT_UNIT_TEST_NOT_CONNECTED",
    ACCESS_TOKEN_SECRET: "0123456789abcdef0123456789abcdef",
    REFRESH_TOKEN_SECRET: "fedcba9876543210fedcba9876543210",
    ORGANIZER_FRONTEND_URL: "http://localhost:5175",
    FRONTEND_URL: "http://localhost:5173",
};

const runScenario = (extraEnv, script) => {
    const result = spawnSync(
        process.execPath,
        ["--input-type=module", "-e", script],
        { cwd: process.cwd(), env: { ...baseEnv, ...extraEnv }, encoding: "utf8", timeout: 30000 }
    );

    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout.trim().split("\n").pop());
};

const strategyProbe = `
    const { default: passport } = await import("./src/config/passport.js");
    console.log(JSON.stringify({ registered: Boolean(passport._strategy("google")) }));
    process.exit(0);
`;

test("backend loads without a Google strategy when GOOGLE_CLIENT_ID is not configured", () => {
    const outcome = runScenario({ GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "" }, strategyProbe);
    assert.equal(outcome.registered, false);
});

test("Google strategy is still registered when GOOGLE_CLIENT_ID is configured", () => {
    const outcome = runScenario(
        {
            GOOGLE_CLIENT_ID: "unit-test-client-id",
            GOOGLE_CLIENT_SECRET: "unit-test-client-secret",
            GOOGLE_CALLBACK_URL: "http://localhost:3000/api/auth/google/callback",
        },
        strategyProbe
    );
    assert.equal(outcome.registered, true);
});

test("Google callback fails explicitly and safely when Google OAuth is not configured", () => {
    const outcome = runScenario(
        { GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "" },
        `
        const { googleCallbackController } = await import("./src/module/auth/auth.controller.js");
        let redirectUrl = "";
        let cookiesSet = 0;
        const res = {
            redirect: (url) => { redirectUrl = url; return res; },
            cookie: () => { cookiesSet += 1; },
        };
        await googleCallbackController({ query: { state: "forged", portal: "organizer" }, headers: {} }, res, () => {});
        console.log(JSON.stringify({ redirectUrl, cookiesSet }));
        process.exit(0);
        `
    );

    assert.match(outcome.redirectUrl, /\/organizer\/login\?error=google_auth_failed$/);
    assert.equal(outcome.cookiesSet, 0);
});
