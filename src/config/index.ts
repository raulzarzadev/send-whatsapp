import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  apiSecretKey: process.env.API_SECRET_KEY || 'change-me-in-production',
  logLevel: process.env.LOG_LEVEL || 'info',
  sessionsDir: process.env.SESSIONS_DIR || './sessions'
}
