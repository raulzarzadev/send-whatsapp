import express, { Application } from 'express'
import cors from 'cors'
import path from 'path'
import { config } from './config'
import apiRoutes from './routes/api'
import { authenticateApiKey, rateLimitMiddleware } from './middleware/auth'

const app: Application = express()

// Trust proxy (importante para obtener IP real detrás de proxies/load balancers)
app.set('trust proxy', 1)

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting global (100 requests por minuto por IP)
app.use(rateLimitMiddleware(100, 60000))

// Serve static files (Frontend)
app.use(express.static(path.join(__dirname, '../public')))

// API Routes con autenticación
app.use('/api', authenticateApiKey, apiRoutes)

// Root endpoint - Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// Start server
const PORT = config.port

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`🌐 Web Interface: http://localhost:${PORT}`)
  console.log(`📱 WhatsApp Multi-Instance API ready`)
  console.log(`🔑 Remember to set your API_SECRET_KEY in .env file`)
})

export default app
