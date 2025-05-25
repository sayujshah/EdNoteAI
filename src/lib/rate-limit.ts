// Simple in-memory rate limiter for API endpoints
// For production, consider using Redis or external rate limiting service

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  limit: number = 100, // requests per window
  windowMs: number = 60 * 1000 // 1 minute window
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries
  if (store[key] && now > store[key].resetTime) {
    delete store[key];
  }

  // Initialize or get current count
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs
    };
  }

  store[key].count++;

  const remaining = Math.max(0, limit - store[key].count);
  const success = store[key].count <= limit;

  return {
    success,
    remaining,
    resetTime: store[key].resetTime
  };
}

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
} 