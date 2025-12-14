const rateLimit = require('express-rate-limit');

// General API Rate Limiting (Normal usage)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin." }
});

// Auth Rate Limiting (Strict - Login, Register, Forgot Password)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minutes
    max: 10, // Limit each IP to 10 attempts
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Çok fazla başarısız giriş denemesi. Lütfen 15 dakika bekleyin." }
});

module.exports = { apiLimiter, authLimiter };
