const express = require('express')
const controller = require('../controllers/resources')
const { uploadResourceSchema } = require('../validators/resources')
const { validateWithZod } = require('../middlewares/validation')
const { authenticateApiKey } = require('../middlewares/authentication')
const upload = require('../middlewares/fileUpload')
const router = express.Router()

router.use(authenticateApiKey)

// Read
router.get('/', controller.getResources)
router.get('/summary', controller.getResourceSummary)
router.get('/:id', controller.getResource)

// Create
router.post('/', upload.single('file'), validateWithZod(uploadResourceSchema), controller.uploadResource)

module.exports = router