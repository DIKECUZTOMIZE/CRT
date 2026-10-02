import crypto from "node:crypto";

import { getRedisClient } from "../../config/redis.js";

const OAUTH_STATE_TTL_SECONDS = 300;
export const stateStore = new Map();
export const __stateStore = stateStore;

export const OAUTH_PORTALS = Object.freeze({
    USER: "user",
    ORGANIZER: "organizer",
});

const normalizePortal = (value) => {
    const normalized = String(value ?? "").trim().toLowerCase();

    if (normalized === "organizer") {
        return OAUTH_PORTALS.ORGANIZER;
    }

    return OAUTH_PORTALS.USER;
};

const stateKey = (state) => `google_oauth_state:${state}`;

const readStateRecord = async (state) => {
    const redisClient = getRedisClient();
    const key = stateKey(state);

    if (redisClient?.isOpen) {
        const payload = await redisClient.get(key);
        if (!payload) {
            return null;
        }

        try {
            return JSON.parse(payload);
        } catch (error) {
            return null;
        }
    }

    return stateStore.get(key) ?? null;
};

const writeStateRecord = async (state, record) => {
    const redisClient = getRedisClient();
    const key = stateKey(state);

    if (redisClient?.isOpen) {
        await redisClient.set(key, JSON.stringify(record), {
            EX: OAUTH_STATE_TTL_SECONDS,
        });
        return;
    }

    stateStore.set(key, record);
};

const deleteStateRecord = async (state) => {
    const redisClient = getRedisClient();
    const key = stateKey(state);

    if (redisClient?.isOpen) {
        await redisClient.del(key);
        return;
    }

    stateStore.delete(key);
};

export const getGoogleOAuthPortal = (value) => normalizePortal(value);

export const createGoogleOAuthState = async (portal) => {
    const normalizedPortal = normalizePortal(portal);
    const state = crypto.randomBytes(32).toString("hex");
    const record = {
        portal: normalizedPortal,
        createdAt: Date.now(),
        expiresAt: Date.now() + OAUTH_STATE_TTL_SECONDS * 1000,
        used: false,
    };

    await writeStateRecord(state, record);
    return state;
};

export const validateGoogleOAuthState = async (state, expectedPortal) => {
    const normalizedState = String(state ?? "").trim();

    if (!normalizedState) {
        return {
            valid: false,
            reason: "Missing OAuth state",
            portal: null,
        };
    }

    const record = await readStateRecord(normalizedState);

    if (!record) {
        return {
            valid: false,
            reason: "Invalid or expired OAuth state",
            portal: null,
        };
    }

    if (Number(record.expiresAt || 0) <= Date.now()) {
        await deleteStateRecord(normalizedState);
        return {
            valid: false,
            reason: "Expired OAuth state",
            portal: null,
        };
    }

    if (record.used) {
        await deleteStateRecord(normalizedState);
        return {
            valid: false,
            reason: "OAuth state has already been used",
            portal: null,
        };
    }

    const normalizedExpectedPortal = expectedPortal ? normalizePortal(expectedPortal) : null;
    if (normalizedExpectedPortal && record.portal !== normalizedExpectedPortal) {
        await deleteStateRecord(normalizedState);
        return {
            valid: false,
            reason: "OAuth portal mismatch",
            portal: null,
        };
    }

    const updatedRecord = {
        ...record,
        used: true,
        consumedAt: Date.now(),
    };

    await writeStateRecord(normalizedState, updatedRecord);

    return {
        valid: true,
        reason: "OAuth state validated",
        portal: record.portal,
    };
};

export const clearGoogleOAuthState = async (state) => {
    if (!state) {
        return;
    }

    await deleteStateRecord(String(state).trim());
};

export const getGoogleOAuthStateTtlSeconds = () => OAUTH_STATE_TTL_SECONDS;
