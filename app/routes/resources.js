const express = require('express')
const controller = require('../controllers/resources')
const { uploadResourceSchema } = require('../validators/resources')
const { validateWithZod } = require('../middlewares/validation')
const upload = require('../middlewares/fileUpload')
const router = express.Router()

// Read
router.get('/', controller.getResources)
router.get('/:id', controller.getResource)
router.get('/summary', controller.getResourceSummary)

// Create
router.post('/', upload.single('file'), validateWithZod(uploadResourceSchema), controller.uploadResource)

module.exports = router