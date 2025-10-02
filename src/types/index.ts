export interface WhatsAppSession {
  sessionId: string
  clientId: string
  status: 'connecting' | 'qr' | 'connected' | 'disconnected'
  qrCode?: string
  phone?: string
  createdAt: Date
  lastActivity: Date
}

export interface SendMessageRequest {
  sessionId: string
  to: string
  message: string
}

export interface CreateSessionRequest {
  clientId: string
  sessionId?: string
}

export interface MessageLog {
  id?: number
  sessionId: string
  clientId: string
  to: string
  message: string
  status: 'sent' | 'failed'
  error?: string
  timestamp: Date
}

export interface MessageLogFilters {
  sessionId?: string
  clientId?: string
  to?: string
  status?: 'sent' | 'failed'
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}
