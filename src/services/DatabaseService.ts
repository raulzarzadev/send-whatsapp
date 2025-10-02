import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { MessageLog, MessageLogFilters } from '../types'

export class DatabaseService {
  private db: Database.Database
  private dbPath: string

  constructor() {
    // Crear directorio para la base de datos si no existe
    const dbDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    this.dbPath = path.join(dbDir, 'whatsapp.db')
    this.db = new Database(this.dbPath)
    this.initializeDatabase()
  }

  /**
   * Inicializa las tablas de la base de datos
   */
  private initializeDatabase(): void {
    // Crear tabla para logs de mensajes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS message_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        to_number TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Crear índices para mejorar las consultas
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_session_id ON message_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_client_id ON message_logs(client_id);
      CREATE INDEX IF NOT EXISTS idx_to_number ON message_logs(to_number);
      CREATE INDEX IF NOT EXISTS idx_status ON message_logs(status);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON message_logs(timestamp);
    `)

    console.log('✅ Database initialized at:', this.dbPath)
  }

  /**
   * Guarda un log de mensaje en la base de datos
   */
  saveMessageLog(log: MessageLog): number {
    const stmt = this.db.prepare(`
      INSERT INTO message_logs (session_id, client_id, to_number, message, status, error, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const info = stmt.run(
      log.sessionId,
      log.clientId,
      log.to,
      log.message,
      log.status,
      log.error || null,
      log.timestamp.toISOString()
    )

    return info.lastInsertRowid as number
  }

  /**
   * Obtiene logs de mensajes con filtros opcionales
   */
  getMessageLogs(filters: MessageLogFilters = {}): MessageLog[] {
    let query = 'SELECT * FROM message_logs WHERE 1=1'
    const params: any[] = []

    if (filters.sessionId) {
      query += ' AND session_id = ?'
      params.push(filters.sessionId)
    }

    if (filters.clientId) {
      query += ' AND client_id = ?'
      params.push(filters.clientId)
    }

    if (filters.to) {
      query += ' AND to_number = ?'
      params.push(filters.to)
    }

    if (filters.status) {
      query += ' AND status = ?'
      params.push(filters.status)
    }

    if (filters.startDate) {
      query += ' AND timestamp >= ?'
      params.push(filters.startDate.toISOString())
    }

    if (filters.endDate) {
      query += ' AND timestamp <= ?'
      params.push(filters.endDate.toISOString())
    }

    query += ' ORDER BY timestamp DESC'

    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }

    if (filters.offset) {
      query += ' OFFSET ?'
      params.push(filters.offset)
    }

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as any[]

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      clientId: row.client_id,
      to: row.to_number,
      message: row.message,
      status: row.status,
      error: row.error,
      timestamp: new Date(row.timestamp)
    }))
  }

  /**
   * Obtiene estadísticas de mensajes
   */
  getMessageStats(filters: { sessionId?: string; clientId?: string } = {}) {
    let query = 'SELECT status, COUNT(*) as count FROM message_logs WHERE 1=1'
    const params: any[] = []

    if (filters.sessionId) {
      query += ' AND session_id = ?'
      params.push(filters.sessionId)
    }

    if (filters.clientId) {
      query += ' AND client_id = ?'
      params.push(filters.clientId)
    }

    query += ' GROUP BY status'

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as any[]

    const stats: any = {
      total: 0,
      sent: 0,
      failed: 0
    }

    rows.forEach((row) => {
      stats[row.status] = row.count
      stats.total += row.count
    })

    return stats
  }

  /**
   * Elimina logs antiguos (útil para mantenimiento)
   */
  cleanOldLogs(daysToKeep: number = 90): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const stmt = this.db.prepare(`
      DELETE FROM message_logs WHERE timestamp < ?
    `)

    const info = stmt.run(cutoffDate.toISOString())
    return info.changes
  }

  /**
   * Cierra la conexión a la base de datos
   */
  close(): void {
    this.db.close()
  }

  /**
   * Obtiene la instancia de la base de datos (para consultas personalizadas)
   */
  getDatabase(): Database.Database {
    return this.db
  }
}
