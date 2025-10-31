// render/src/server.ts
// Servidor HTTP simples para Railway

import cors from "cors"
import express from "express"
import { healthCheck } from "./health"
import backupRoutes from "./routes/backup"
import rdsSnapshotsRoutes from "./routes/rds-snapshots"

const app = express()
const _PORT = process.env.PORT || 3333

// Middleware
app.use(express.json())

// CORS configuration
app.use(cors({
	origin: [
		'http://localhost:3000',
		'http://localhost:3001',
    'healthcheck.railway.app',
    'https://healthcheck.railway.app',
		'https://filipemoreno.com.br',
		'https://mercado.filipemoreno.com.br',
		process.env.FRONTEND_URL || 'http://localhost:3000'
	],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
}))

// Health check endpoint
app.get("/health", async (_req, res) => {
	try {
		const health = await healthCheck()
		const statusCode = health.status === "healthy" ? 200 : 503
		res.status(statusCode).json(health)
	} catch (error) {
		res.status(503).json({
			status: "error",
			timestamp: new Date().toISOString(),
			error: error instanceof Error ? error.message : "Unknown error",
		})
	}
})

// API Routes
app.use("/api/backup", backupRoutes)
app.use("/api/rds/snapshots", rdsSnapshotsRoutes)

// Root endpoint
app.get("/", (_req, res) => {
	res.json({
		message: "Mercado304 Background Worker",
		status: "running",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	})
})

export default app
