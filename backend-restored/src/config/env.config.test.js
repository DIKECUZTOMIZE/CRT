import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const loadModule = async (suffix = '') => {
    const importUrl = pathToFileURL(`${process.cwd()}/src/config/config.js`).href + suffix;
    return import(importUrl);
};

test('config centralizes validated frontend and cors values', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.MONGO_URI = 'mongodb://localhost:27017/crt';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.CORS_ORIGIN = 'http://localhost:5173,http://localhost:5174,http://localhost:5175';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.ACCESS_TOKEN_SECRET = '0123456789abcdef0123456789abcdef';
    process.env.REFRESH_TOKEN_SECRET = 'fedcba9876543210fedcba9876543210';
    process.env.LOGGER_LEVEL = 'info';
    process.env.RATELIMIT_WINDOW_MS = '900000';
    process.env.RATELIMIT = '100';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/auth/google/callback';
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'demo-key';
    process.env.CLOUDINARY_API_SECRET = 'demo-secret';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'demo@gmail.com';
    process.env.SMTP_PASS = 'demo-pass';
    process.env.SMTP_FROM = 'demo@gmail.com';

    const { default: config } = await loadModule(`?test=${Date.now()}`);

    assert.equal(config.app.frontendUrl, 'http://localhost:5173');
    assert.deepEqual(config.security.allowedOrigins, [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
    ]);
    assert.equal(config.app.port, 3000);
    assert.equal(config.database.mongoUri, 'mongodb://localhost:27017/crt');
});
