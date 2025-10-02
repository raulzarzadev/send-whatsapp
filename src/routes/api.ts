import { Router, Request, Response } from 'express'
import { SessionManager } from '../services/SessionManager'
import { CreateSessionRequest, SendMessageRequest } from '../types'

const router = Router()
const sessionManager = new SessionManager()

// Restaurar sesiones al iniciar
sessionManager.restoreSessions().catch((error) => {
  console.error('Error restoring sessions:', error)
})

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'WhatsApp API is running',
    timestamp: new Date().toISOString()
  })
})

/**
 * POST /sessions
 * Create a new WhatsApp session
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { clientId, sessionId }: CreateSessionRequest = req.body

    if (!clientId) {
      res.status(400).json({
        success: false,
        error: 'clientId is required'
      })
      return
    }

    const session = await sessionManager.createSession(clientId, sessionId)
    await sessionManager.saveSessionMetadata(session.sessionId)

    res.status(201).json({
      success: true,
      data: session
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create session'
    })
  }
})

/**
 * GET /sessions
 * Get all sessions or filter by clientId
 */
router.get('/sessions', (req: Request, res: Response) => {
  try {
    const { clientId } = req.query

    const sessions = clientId
      ? sessionManager.getSessionsByClient(clientId as string)
      : sessionManager.getAllSessions()

    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sessions'
    })
  }
})

/**
 * GET /sessions/:sessionId
 * Get a specific session by ID
 */
router.get('/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const session = sessionManager.getSession(sessionId)

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      })
      return
    }

    res.json({
      success: true,
      data: session
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session'
    })
  }
})

/**
 * GET /sessions/:sessionId/qr
 * Get QR code for a session
 */
router.get('/sessions/:sessionId/qr', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const session = sessionManager.getSession(sessionId)

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      })
      return
    }

    if (!session.qrCode) {
      res.status(404).json({
        success: false,
        error: 'QR code not available. Session may already be connected.'
      })
      return
    }

    res.json({
      success: true,
      data: {
        qrCode: session.qrCode,
        sessionId: session.sessionId,
        status: session.status
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get QR code'
    })
  }
})

/**
 * DELETE /sessions/:sessionId
 * Delete a session
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    await sessionManager.deleteSession(sessionId)

    res.json({
      success: true,
      message: 'Session deleted successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete session'
    })
  }
})

/**
 * POST /messages/send
 * Send a WhatsApp message
 */
router.post('/messages/send', async (req: Request, res: Response) => {
  try {
    const { sessionId, to, message }: SendMessageRequest = req.body

    if (!sessionId || !to || !message) {
      res.status(400).json({
        success: false,
        error: 'sessionId, to, and message are required'
      })
      return
    }

    await sessionManager.sendMessage(sessionId, to, message)

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        sessionId,
        to,
        sentAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    })
  }
})

export default router
