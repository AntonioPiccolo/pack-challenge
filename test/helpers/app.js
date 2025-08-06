const express = require('express');
const cors = require('cors');
const resources = require('../../app/routes/resources');

function createTestApp() {
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());

  app.use('/api/resources', resources);
  
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test'
    });
  });

  return app;
}

module.exports = { createTestApp };