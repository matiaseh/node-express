import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import stream from 'stream';
import dotenv from 'dotenv';
dotenv.config();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size
});

// Middleware function to handle file uploads
export const uploadImages = async (req, res, next) => {
  upload.array('images', 5)(req, res, async err => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'File upload error', error: err.message });
    }

    try {
      const uploadedFiles = [];
      for (const file of req.files) {
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `posts/${uuidv4()}-${file.originalname}`,
          Body: file.buffer,
          ACL: 'public-read',
        };

        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);

        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        uploadedFiles.push(fileUrl);
      }

      console.log('Uploaded file URLs:', uploadedFiles); // Debugging line

      req.fileUrls = uploadedFiles;
      next();
    } catch (uploadError) {
      res
        .status(500)
        .json({ message: 'Error uploading files', error: uploadError.message });
    }
  });
};
