const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-south-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'pack-challenge-uploads';

const uploadFileToS3 = async (file, key) => {
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: `attachment; filename="${file.originalname}"`,
      },
    });

    const result = await upload.done();
    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
    };
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

const generateS3Key = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');
  
  return `uploads/${timestamp}-${randomString}-${baseName}.${extension}`;
};

const downloadFileFromS3 = async (s3Key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    return {
      stream: response.Body,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata
    };
  } catch (error) {
    throw new Error(`S3 download failed: ${error.message}`);
  }
};

module.exports = {
  s3Client,
  uploadFileToS3,
  downloadFileFromS3,
  generateS3Key,
  BUCKET_NAME,
};