const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient } = require('../config/redis.js');

// Determine store based on environment
const getStore = (prefix) => {
    if (process.env.NODE_ENV === 'test' || !redisClient) {
        return undefined;
    }
    return new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: prefix
    });
};

// General API Rate Limiter
const apiLimiter = rateLimit({
    store: getStore('rl:api:'),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1500, // Local development + test ortamında 429 almamak için 200 -> 1500 yapıldı.
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({ error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.' });
    }
});

// Stricter Auth Rate Limiter (Login, Register etc.)
const authLimiter = rateLimit({
    store: getStore('rl:auth:'),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // BU SINIRI DEBUG VE TEST İÇİN GEÇİCİ OLARAK ARTTIRIYORUZ (10 -> 50)
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: 'Çok fazla doğrulama denemesi yaptınız. Hesabınızın güvenliği için lütfen 1 saat bekleyin.' });
    }
});

module.exports = { apiLimiter, authLimiter };
