const swaggerDocument = require('./swagger.json')

const getDynamicSwaggerConfig = (req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`
  
  const dynamicSwagger = {
    ...swaggerDocument,
    servers: [
      {
        url: baseUrl,
        description: "Current server"
      },
      {
        url: "http://localhost:3000", 
        description: "Development server"
      }
    ]
  }
  
  return dynamicSwagger
}

module.exports = {
  getDynamicSwaggerConfig
}