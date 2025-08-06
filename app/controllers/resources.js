const { db } = require('../config/database');

const getResources = async (req, res) => {
    try {
        const resources = await db.selectFrom('resources').selectAll().execute();
        res.json({ success: true, data: resources });
    } catch (error) {
        console.error('Failed to fetch resources:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const getResource = async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await db.selectFrom('resources')
            .selectAll()
            .where('id', '=', parseInt(id))
            .executeTakeFirst();
        
        if (!resource) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }

        // In local environment, files are not stored
        if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'test') {
            return res.status(200).json({
                success: true,
                message: 'Files are not stored in local development environment',
                data: {
                    resource_id: resource.id,
                    file_name: resource.file_name,
                    note: 'File download is not available in local development mode'
                }
            });
        } else if (resource.s3_key) {
            try {
                const { downloadFileFromS3 } = require('../config/s3');
                const fileData = await downloadFileFromS3(resource.s3_key);
                
                res.set({
                    'Content-Type': resource.mime_type || fileData.contentType || 'application/octet-stream',
                    'Content-Length': resource.file_size || fileData.contentLength,
                    'Content-Disposition': `attachment; filename="${resource.file_name}"`,
                    'Last-Modified': fileData.lastModified?.toUTCString()
                });

                fileData.stream.pipe(res);
            } catch (s3Error) {
                console.error('Failed to download file from S3:', s3Error.message);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        } else {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
    } catch (error) {
        console.error('Failed to fetch resource:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const getResourceSummary = async (req, res) => {
    try {
        const summary = await db.selectFrom('resources')
            .select([
                (eb) => eb.fn.count('id').as('total_resources'),
                (eb) => eb.fn.sum('file_size').as('total_size')
            ])
            .executeTakeFirst();

        const categoriesBreakdown = await db.selectFrom('resources')
            .select([
                'category',
                (eb) => eb.fn.count('id').as('count')
            ])
            .groupBy('category')
            .execute();

        const languagesBreakdown = await db.selectFrom('resources')
            .select([
                'language',
                (eb) => eb.fn.count('id').as('count')
            ])
            .groupBy('language')
            .execute();

        const providersBreakdown = await db.selectFrom('resources')
            .select([
                'provider',
                (eb) => eb.fn.count('id').as('count')
            ])
            .groupBy('provider')
            .execute();

        const rolesBreakdown = await db.selectFrom('resources')
            .select([
                'role',
                (eb) => eb.fn.count('id').as('count')
            ])
            .groupBy('role')
            .execute();
        
        res.json({
            success: true,
            data: {
                ...summary,
                categories_breakdown: categoriesBreakdown,
                languages_breakdown: languagesBreakdown,
                providers_breakdown: providersBreakdown,
                roles_breakdown: rolesBreakdown
            }
        });
    } catch (error) {
        console.error('Failed to fetch summary:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const uploadResource = async (req, res) => {
    try {
        console.log('Upload request received:', { body: req.body, file: req.file ? 'file present' : 'no file' });
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { title, description, category, language, provider, role } = req.validatedData;
        console.log('Validated data:', { title, description, category, language, provider, role });
        
        let s3Key = null;
        let s3Bucket = null;
        let filePath = null;
        
        if (process.env.NODE_ENV !== 'local' && process.env.NODE_ENV !== 'test') {
            // Upload to S3 only in non-local environments
            const { uploadFileToS3, generateS3Key } = require('../config/s3');
            s3Key = generateS3Key(req.file.originalname);
            const s3Result = await uploadFileToS3(req.file, s3Key);
            s3Bucket = s3Result.bucket;
            filePath = s3Result.url;
        } else {
            // In local environment, files are not stored anywhere
            filePath = 'no-storage';
        }
        
        // Insert resource into database
        const resource = await db.insertInto('resources')
            .values({
                title,
                description,
                category,
                language, 
                provider,
                role,
                file_name: req.file.originalname,
                file_path: filePath,
                s3_key: s3Key,
                s3_bucket: s3Bucket,
                file_size: req.file.size,
                mime_type: req.file.mimetype
            })
            .returning([
                'id', 'title', 'description', 'category', 'language', 
                'provider', 'role', 'file_name', 'file_path', 's3_key',
                'file_size', 'mime_type', 'created_at'
            ])
            .executeTakeFirst();

        res.status(201).json({
            success: true,
            message: 'Resource uploaded successfully',
            data: resource
        });
    } catch (error) {
        console.error('Failed to upload resource:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

module.exports = {
    getResources,
    getResource,
    getResourceSummary,
    uploadResource,
}