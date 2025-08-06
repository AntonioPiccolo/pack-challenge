const validateWithZod = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body)
      req.validatedData = validatedData
      next()
    } catch (error) {
      console.log('Validation error:', error);
      console.log('Error name:', error.name);
      console.log('Error issues:', error.issues);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues ? error.issues.map(err => ({
            field: err.path ? err.path.join('.') : 'unknown',
            message: err.message,
            value: err.received
          })) : [{ message: error.message }]
        })
      }
      
      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
        error: error.message
      })
    }
  }
}

module.exports = {
  validateWithZod
}