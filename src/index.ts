import express, { Application } from 'express'
import cors from 'cors'
import { config } from './config'
import apiRoutes from './routes/api'
import { authenticateApiKey } from './middleware/auth'

const app: Application = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', authenticateApiKey, apiRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Multi-Instance API',
    version: '1.0.0',
    documentation: '/api/health'
  })
})

// Start server
const PORT = config.port

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📱 WhatsApp Multi-Instance API ready`)
  console.log(`🔑 Remember to set your API_SECRET_KEY in .env file`)
})

export default app
