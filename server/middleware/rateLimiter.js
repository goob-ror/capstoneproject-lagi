// Rate limiter with progressive cooldown for login attempts
class RateLimiter {
  constructor() {
    // Store: { ip: { attempts: number, lockedUntil: timestamp, cooldownLevel: number } }
    this.attempts = new Map();
    
    // Cooldown levels in minutes
    this.cooldownLevels = [10, 20, 30, 60]; // 10min, 20min, 30min, 60min (max)
    this.maxAttempts = 10;
    
    // Clean up old entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  getClientIp(req) {
    // Get real IP even behind proxy
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress;
  }

  checkRateLimit(req, res, next) {
    const ip = this.getClientIp(req);
    const now = Date.now();
    
    // Get or create attempt record
    let record = this.attempts.get(ip);
    
    if (!record) {
      record = { attempts: 0, lockedUntil: null, cooldownLevel: 0 };
      this.attempts.set(ip, record);
    }

    // Check if IP is currently locked
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingTime = Math.ceil((record.lockedUntil - now) / 1000 / 60);
      return res.status(429).json({
        message: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${remainingTime} menit.`,
        remainingTime,
        lockedUntil: new Date(record.lockedUntil).toISOString()
      });
    }

    // If lock expired, reset attempts but keep cooldown level
    if (record.lockedUntil && now >= record.lockedUntil) {
      record.attempts = 0;
      record.lockedUntil = null;
      // Keep cooldownLevel for progressive penalty
    }

    // Allow the request to proceed
    req.rateLimitInfo = { ip, record };
    next();
  }

  recordFailedAttempt(req) {
    const { ip, record } = req.rateLimitInfo;
    const now = Date.now();
    
    record.attempts += 1;

    // Check if max attempts reached
    if (record.attempts >= this.maxAttempts) {
      // Get cooldown duration based on current level
      const cooldownMinutes = this.cooldownLevels[record.cooldownLevel];
      record.lockedUntil = now + (cooldownMinutes * 60 * 1000);
      
      // Increase cooldown level for next time (max at last level)
      if (record.cooldownLevel < this.cooldownLevels.length - 1) {
        record.cooldownLevel += 1;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`IP ${ip} locked for ${cooldownMinutes} minutes (level ${record.cooldownLevel})`);
      }
      
      return {
        locked: true,
        cooldownMinutes,
        nextCooldownMinutes: this.cooldownLevels[record.cooldownLevel]
      };
    }

    return {
      locked: false,
      attemptsRemaining: this.maxAttempts - record.attempts
    };
  }

  recordSuccessfulLogin(req) {
    const { ip, record } = req.rateLimitInfo;
    
    // Reset everything on successful login
    record.attempts = 0;
    record.lockedUntil = null;
    record.cooldownLevel = 0; // Reset to starting cooldown
    }

  cleanup() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    for (const [ip, record] of this.attempts.entries()) {
      // Remove records that are unlocked and haven't been used in an hour
      if (!record.lockedUntil && record.attempts === 0) {
        this.attempts.delete(ip);
      }
      // Remove very old locked records (older than max cooldown + 1 hour)
      else if (record.lockedUntil && record.lockedUntil < oneHourAgo) {
        this.attempts.delete(ip);
      }
    }
  }

  // Get current status for an IP (useful for debugging/monitoring)
  getStatus(ip) {
    const record = this.attempts.get(ip);
    if (!record) return null;
    
    const now = Date.now();
    return {
      attempts: record.attempts,
      isLocked: record.lockedUntil && now < record.lockedUntil,
      lockedUntil: record.lockedUntil ? new Date(record.lockedUntil) : null,
      cooldownLevel: record.cooldownLevel,
      nextCooldownMinutes: this.cooldownLevels[record.cooldownLevel]
    };
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Export middleware function
const rateLimitMiddleware = (req, res, next) => {
  rateLimiter.checkRateLimit(req, res, next);
};

module.exports = {
  rateLimitMiddleware,
  rateLimiter
};
