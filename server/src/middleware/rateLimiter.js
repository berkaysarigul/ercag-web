const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient } = require('../config/redis.js');

// General API Rate Limiter
const apiLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `windowMs`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({ error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.' });
    }
});

// Stricter Auth Rate Limiter (Login, Register etc.)
const authLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login/register requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: 'Çok fazla doğrulama denemesi yaptınız. Hesabınızın güvenliği için lütfen 1 saat bekleyin.' });
    }
});

module.exports = { apiLimiter, authLimiter };
