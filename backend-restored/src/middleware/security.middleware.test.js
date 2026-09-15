process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.MONGO_URI = 'mongodb://localhost:27017/crt';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CORS_ORIGIN = 'https://crtcompete.com,https://admin.crtcompete.com,https://organizer.crtcompete.com';
process.env.FRONTEND_URL = 'https://crtcompete.com';
process.env.ADMIN_FRONTEND_URL = 'https://admin.crtcompete.com';
process.env.ORGANIZER_FRONTEND_URL = 'https://organizer.crtcompete.com';
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

const test = (await import('node:test')).default;
const assert = (await import('node:assert/strict')).default;
const http = await import('node:http');
const express = (await import('express')).default;

const { default: securityMiddleware } = await import('./security.middleware.js');

test('allows the www frontend origin when the apex domain is configured', async () => {
    const app = express();
    securityMiddleware(app);

    app.get('/api/events/public', (_req, res) => {
        res.status(200).json({ ok: true });
    });

    const server = app.listen(0);

    try {
        const port = await new Promise((resolve) => {
            server.once('listening', () => resolve(server.address().port));
        });

        const response = await new Promise((resolve, reject) => {
            const req = http.request(
                {
                    host: '127.0.0.1',
                    port,
                    path: '/api/events/public',
                    method: 'OPTIONS',
                    headers: {
                        Origin: 'https://www.crtcompete.com',
                        'Access-Control-Request-Method': 'GET',
                    },
                },
                (res) => {
                    const chunks = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () =>
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: Buffer.concat(chunks).toString(),
                        })
                    );
                }
            );

            req.on('error', reject);
            req.end();
        });

        assert.equal(response.statusCode, 204, 'OPTIONS request should be allowed by CORS');
        assert.equal(
            response.headers['access-control-allow-origin'],
            'https://www.crtcompete.com',
            'www subdomain should be accepted when the apex domain is in the allowlist'
        );
    } finally {
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
});
