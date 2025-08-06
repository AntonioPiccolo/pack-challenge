require('dotenv').config()
const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const { getDynamicSwaggerConfig } = require('./config/swagger')
const resources = require('./routes/resources')
const { createResourcesTable } = require('./config/database')

const app = express()
const PORT = process.env.PORT || 3000

// Initialize database tables
setTimeout(() => createResourcesTable(), 2000)

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins - adjust for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Routes
app.use('/api/resources', resources)

app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  const dynamicSwagger = getDynamicSwaggerConfig(req)
  swaggerUi.setup(dynamicSwagger)(req, res, next)
})

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`)
  console.log(`Health check available at http://localhost:${PORT}/health`)
})