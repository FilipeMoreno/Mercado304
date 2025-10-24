// render/src/server.ts
// Servidor HTTP simples para Railway

import express from 'express'
import { healthCheck } from './health'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const health = await healthCheck()
    const statusCode = health.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Mercado304 Background Worker',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor HTTP rodando na porta ${PORT}`)
  console.log(`📊 Health check disponível em: http://localhost:${PORT}/health`)
})

export default app
