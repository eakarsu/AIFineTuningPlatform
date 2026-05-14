const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/**
 * AI endpoint rate limiter: 20 requests per hour per authenticated user.
 * Falls back to IP (IPv6-safe via ipKeyGenerator helper).
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI requests. You are limited to 20 requests per hour. Please try again later.',
    retryAfter: '1 hour',
  },
  keyGenerator: (req, res) => {
    if (req.user?.id) return `user:${req.user.id}`;
    return ipKeyGenerator(req, res);
  },
});

module.exports = { aiRateLimiter };
