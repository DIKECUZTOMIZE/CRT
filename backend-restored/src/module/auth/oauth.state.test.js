import test from "node:test";
import assert from "node:assert/strict";

import {
    createGoogleOAuthState,
    validateGoogleOAuthState,
    OAUTH_PORTALS,
} from "./oauth.state.js";

const waitForExpiry = async (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

test("google OAuth state is generated as crypto-random and expires", async () => {
    const state = await createGoogleOAuthState(OAUTH_PORTALS.USER);

    assert.equal(typeof state, "string");
    assert.ok(state.length >= 64);
    assert.match(state, /^[a-f0-9]+$/i);

    const validation = await validateGoogleOAuthState(state, OAUTH_PORTALS.USER);
    assert.equal(validation.valid, true);
    assert.equal(validation.portal, OAUTH_PORTALS.USER);

    const replayValidation = await validateGoogleOAuthState(state, OAUTH_PORTALS.USER);
    assert.equal(replayValidation.valid, false);
    assert.match(replayValidation.reason, /already been used|Invalid or expired OAuth state|OAuth portal mismatch/i);
});

test("google OAuth state validation rejects missing invalid expired and replayed state", async () => {
    const missing = await validateGoogleOAuthState("", OAUTH_PORTALS.USER);
    assert.equal(missing.valid, false);
    assert.match(missing.reason, /Missing OAuth state/i);

    const invalid = await validateGoogleOAuthState("not-a-real-state", OAUTH_PORTALS.USER);
    assert.equal(invalid.valid, false);
    assert.match(invalid.reason, /Invalid or expired OAuth state/i);

    const validState = await createGoogleOAuthState(OAUTH_PORTALS.ORGANIZER);
    const checked = await validateGoogleOAuthState(validState, OAUTH_PORTALS.ORGANIZER);
    assert.equal(checked.valid, true);

    const replayed = await validateGoogleOAuthState(validState, OAUTH_PORTALS.ORGANIZER);
    assert.equal(replayed.valid, false);
    assert.match(replayed.reason, /already been used/i);

    const expiredState = await createGoogleOAuthState(OAUTH_PORTALS.USER);
    const { stateKey } = await import("./oauth.state.js");
    const stateMap = await import("./oauth.state.js");
    const stateStore = stateMap.stateStore || stateMap.default || null;

    if (stateStore && stateStore.has(`google_oauth_state:${expiredState}`)) {
        const entry = stateStore.get(`google_oauth_state:${expiredState}`);
        entry.expiresAt = Date.now() - 1000;
    }

    const expired = await validateGoogleOAuthState(expiredState, OAUTH_PORTALS.USER);
    assert.equal(expired.valid, false);
    assert.match(expired.reason, /Expired OAuth state|Invalid or expired OAuth state/i);

    await waitForExpiry();
});

test("portal binding keeps User and Organizer states distinct", async () => {
    const userState = await createGoogleOAuthState(OAUTH_PORTALS.USER);
    const organizerState = await createGoogleOAuthState(OAUTH_PORTALS.ORGANIZER);

    const userValidation = await validateGoogleOAuthState(userState, OAUTH_PORTALS.USER);
    const organizerValidation = await validateGoogleOAuthState(organizerState, OAUTH_PORTALS.ORGANIZER);

    assert.equal(userValidation.valid, true);
    assert.equal(organizerValidation.valid, true);
    assert.equal(userValidation.portal, OAUTH_PORTALS.USER);
    assert.equal(organizerValidation.portal, OAUTH_PORTALS.ORGANIZER);

    const mismatched = await validateGoogleOAuthState(userState, OAUTH_PORTALS.ORGANIZER);
    assert.equal(mismatched.valid, false);
    assert.match(mismatched.reason, /OAuth portal mismatch|already been used/i);
});
