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
