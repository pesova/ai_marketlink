import env from '../config/env'
import { Redis } from 'ioredis'

export const redisClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT as unknown as number,
    username: '',
    password: '',
    db: 0,
    keyPrefix: '',
    maxRetriesPerRequest: null,
    keepAlive: 30000,
    enableReadyCheck: true,
    reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
        if (targetErrors.some(t => err.message.includes(t))) {
            console.warn('Reconnecting due to Redis error:', err.message)
            return true
        }
        return false
    },
    retryStrategy(times) {
        // exponential backoff
        return Math.min(times * 200, 2000)
    },
})