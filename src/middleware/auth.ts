import { Request, Response, NextFunction } from 'express'
import { config } from '../config'

export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string

  if (!apiKey || apiKey !== config.apiSecretKey) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing API key'
    })
    return
  }

  next()
}

// Rate limiting básico
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export const rateLimitMiddleware = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()

    const record = requestCounts.get(ip)

    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
      next()
      return
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      })
      return
    }

    record.count++
    next()
  }
}

// Limpiar registros antiguos cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip)
    }
  }
}, 5 * 60 * 1000)
