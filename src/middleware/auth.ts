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
