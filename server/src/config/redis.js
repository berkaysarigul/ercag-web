const Redis = require('ioredis');

// Create a single Redis instance to be used across the app
let redisClient;

if (process.env.NODE_ENV === 'test') {
    // Mock Redis for Jest tests to prevent ECONNREFUSED
    redisClient = {
        call: async () => { },
        on: () => { },
        keys: async () => [],
        del: async () => { }
    };
} else {
    try {
        redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
                if (times > 10) {
                    console.error('⚠️ Redis connection failed: Max retries reached.');
                    return null;
                }
                return Math.min(times * 50, 2000);
            }
        });

        redisClient.on('connect', () => console.log('✅ Redis connected successfully.'));
        redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err.message));

    } catch (error) {
        console.error('❌ Failed to initialize Redis:', error);
    }
}

// Helper to invalidate cache keys by pattern
const invalidateCache = async (pattern) => {
    if (!redisClient) return;
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`[Cache Invalidated] Deleted ${keys.length} keys matching ${pattern}`);
        }
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
};

module.exports = { redisClient, invalidateCache };
