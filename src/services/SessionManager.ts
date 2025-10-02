import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { WhatsAppSession } from '../types'
import { config } from '../config'

interface SessionData {
  socket: WASocket
  info: WhatsAppSession
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map()
  private logger: P.Logger

  constructor() {
    this.logger = P({ level: config.logLevel })
    this.ensureSessionsDir()
  }

  private ensureSessionsDir(): void {
    if (!fs.existsSync(config.sessionsDir)) {
      fs.mkdirSync(config.sessionsDir, { recursive: true })
    }
  }

  async createSession(
    clientId: string,
    sessionId?: string
  ): Promise<WhatsAppSession> {
    const id = sessionId || uuidv4()
    const sessionPath = path.join(config.sessionsDir, id)

    if (this.sessions.has(id)) {
      throw new Error(`Session ${id} already exists`)
    }

    const sessionInfo: WhatsAppSession = {
      sessionId: id,
      clientId,
      status: 'connecting',
      createdAt: new Date(),
      lastActivity: new Date()
    }

    this.sessions.set(id, {
      socket: null as any,
      info: sessionInfo
    })

    await this.startSocket(id, sessionPath)

    return sessionInfo
  }

  private async startSocket(
    sessionId: string,
    sessionPath: string
  ): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const { version } = await fetchLatestBaileysVersion()

    const socket = makeWASocket({
      version,
      logger: this.logger,
      printQRInTerminal: false,
      auth: state,
      generateHighQualityLinkPreview: true
    })

    const sessionData = this.sessions.get(sessionId)
    if (sessionData) {
      sessionData.socket = socket
    }

    socket.ev.on('creds.update', saveCreds)

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      const sessionData = this.sessions.get(sessionId)

      if (!sessionData) return

      if (qr) {
        sessionData.info.qrCode = qr
        sessionData.info.status = 'qr'
        sessionData.info.lastActivity = new Date()

        this.logger.info(`QR Code generated for session ${sessionId}`)
        qrcode.generate(qr, { small: true })
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut

        this.logger.info(
          `Connection closed for session ${sessionId}, reconnecting: ${shouldReconnect}`
        )

        if (shouldReconnect) {
          await this.startSocket(sessionId, sessionPath)
        } else {
          sessionData.info.status = 'disconnected'
          this.sessions.delete(sessionId)
          this.cleanupSessionDir(sessionPath)
        }
      }

      if (connection === 'open') {
        sessionData.info.status = 'connected'
        sessionData.info.lastActivity = new Date()
        sessionData.info.qrCode = undefined

        const phone = socket.user?.id?.split(':')[0]
        if (phone) {
          sessionData.info.phone = phone
        }

        this.logger.info(`Session ${sessionId} connected successfully`)
      }
    })

    socket.ev.on('messages.upsert', () => {
      const sessionData = this.sessions.get(sessionId)
      if (sessionData) {
        sessionData.info.lastActivity = new Date()
      }
    })
  }

  private cleanupSessionDir(sessionPath: string): void {
    try {
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true })
      }
    } catch (error) {
      this.logger.error(`Error cleaning up session directory: ${error}`)
    }
  }

  async sendMessage(
    sessionId: string,
    to: string,
    message: string
  ): Promise<void> {
    const sessionData = this.sessions.get(sessionId)

    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`)
    }

    if (sessionData.info.status !== 'connected') {
      throw new Error(`Session ${sessionId} is not connected`)
    }

    const formattedNumber = to.includes('@s.whatsapp.net')
      ? to
      : `${to}@s.whatsapp.net`

    await sessionData.socket.sendMessage(formattedNumber, { text: message })
    sessionData.info.lastActivity = new Date()

    this.logger.info(`Message sent from session ${sessionId} to ${to}`)
  }

  getSession(sessionId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessionId)?.info
  }

  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values()).map((data) => data.info)
  }

  getSessionsByClient(clientId: string): WhatsAppSession[] {
    return Array.from(this.sessions.values())
      .filter((data) => data.info.clientId === clientId)
      .map((data) => data.info)
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessionData = this.sessions.get(sessionId)

    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`)
    }

    try {
      await sessionData.socket.logout()
    } catch (error) {
      this.logger.error(`Error logging out session ${sessionId}: ${error}`)
    }

    this.sessions.delete(sessionId)
    const sessionPath = path.join(config.sessionsDir, sessionId)
    this.cleanupSessionDir(sessionPath)

    this.logger.info(`Session ${sessionId} deleted`)
  }

  async restoreSessions(): Promise<void> {
    const sessionsDir = config.sessionsDir

    if (!fs.existsSync(sessionsDir)) {
      return
    }

    const sessionDirs = fs.readdirSync(sessionsDir).filter((file) => {
      const filePath = path.join(sessionsDir, file)
      return fs.statSync(filePath).isDirectory()
    })

    this.logger.info(`Restoring ${sessionDirs.length} sessions...`)

    for (const sessionDir of sessionDirs) {
      const sessionId = sessionDir
      const sessionPath = path.join(sessionsDir, sessionDir)

      try {
        // Para restaurar necesitamos el clientId, lo guardamos en un archivo metadata
        const metadataPath = path.join(sessionPath, 'metadata.json')
        let clientId = 'unknown'

        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
          clientId = metadata.clientId
        }

        const sessionInfo: WhatsAppSession = {
          sessionId,
          clientId,
          status: 'connecting',
          createdAt: new Date(),
          lastActivity: new Date()
        }

        this.sessions.set(sessionId, {
          socket: null as any,
          info: sessionInfo
        })

        await this.startSocket(sessionId, sessionPath)
      } catch (error) {
        this.logger.error(`Error restoring session ${sessionId}: ${error}`)
      }
    }
  }

  // Guardar metadata del cliente
  async saveSessionMetadata(sessionId: string): Promise<void> {
    const sessionData = this.sessions.get(sessionId)
    if (!sessionData) return

    const sessionPath = path.join(config.sessionsDir, sessionId)
    const metadataPath = path.join(sessionPath, 'metadata.json')

    const metadata = {
      clientId: sessionData.info.clientId,
      createdAt: sessionData.info.createdAt
    }

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
  }
}
