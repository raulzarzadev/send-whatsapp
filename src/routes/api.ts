import { Router, Request, Response } from 'express'
import { SessionManager } from '../services/SessionManager'
import { DatabaseService } from '../services/DatabaseService'
import {
  CreateSessionRequest,
  SendMessageRequest,
  MessageLogFilters
} from '../types'

const router: Router = Router()
const sessionManager = new SessionManager()
const databaseService = new DatabaseService()

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
  const { sessionId, to, message }: SendMessageRequest = req.body
  const timestamp = new Date()

  try {
    if (!sessionId || !to || !message) {
      res.status(400).json({
        success: false,
        error: 'sessionId, to, and message are required'
      })
      return
    }

    // Obtener información de la sesión
    const session = sessionManager.getSession(sessionId)
    if (!session) {
      // Guardar log de mensaje fallido
      try {
        databaseService.saveMessageLog({
          sessionId,
          clientId: 'unknown',
          to,
          message,
          status: 'failed',
          error: 'Session not found',
          timestamp
        })
      } catch (err) {
        console.error('Error saving log:', err)
      }

      res.status(404).json({
        success: false,
        error: 'Session not found'
      })
      return
    }

    // Enviar mensaje
    await sessionManager.sendMessage(sessionId, to, message)

    // Guardar log de mensaje exitoso
    try {
      databaseService.saveMessageLog({
        sessionId,
        clientId: session.clientId,
        to,
        message,
        status: 'sent',
        timestamp
      })
    } catch (err) {
      console.error('Error saving log:', err)
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        sessionId,
        to,
        sentAt: timestamp.toISOString()
      }
    })
  } catch (error: any) {
    // Guardar log de mensaje fallido
    const session = sessionManager.getSession(sessionId)
    try {
      databaseService.saveMessageLog({
        sessionId,
        clientId: session?.clientId || 'unknown',
        to,
        message,
        status: 'failed',
        error: error.message,
        timestamp
      })
    } catch (err) {
      console.error('Error saving log:', err)
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    })
  }
})

/**
 * GET /messages/logs
 * Get message logs with optional filters
 */
router.get('/messages/logs', (req: Request, res: Response) => {
  try {
    const filters: MessageLogFilters = {}

    // Extraer filtros de query parameters
    if (req.query.sessionId) filters.sessionId = req.query.sessionId as string
    if (req.query.clientId) filters.clientId = req.query.clientId as string
    if (req.query.to) filters.to = req.query.to as string
    if (req.query.status) filters.status = req.query.status as 'sent' | 'failed'
    if (req.query.startDate)
      filters.startDate = new Date(req.query.startDate as string)
    if (req.query.endDate)
      filters.endDate = new Date(req.query.endDate as string)
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string)
    if (req.query.offset) filters.offset = parseInt(req.query.offset as string)

    const logs = databaseService.getMessageLogs(filters)

    res.json({
      success: true,
      data: logs,
      count: logs.length
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get message logs'
    })
  }
})

/**
 * GET /messages/stats
 * Get message statistics
 */
router.get('/messages/stats', (req: Request, res: Response) => {
  try {
    const filters: { sessionId?: string; clientId?: string } = {}

    if (req.query.sessionId) filters.sessionId = req.query.sessionId as string
    if (req.query.clientId) filters.clientId = req.query.clientId as string

    const stats = databaseService.getMessageStats(filters)

    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get message stats'
    })
  }
})

export default router
