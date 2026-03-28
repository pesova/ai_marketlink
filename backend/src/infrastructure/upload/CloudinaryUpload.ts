import multer from 'multer';
import cloudinary from 'cloudinary';
import env from '../../config/env';

cloudinary.v2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const memoryStorage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, png and webp images are allowed'));
  }
};

export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// Upload a single buffer to Cloudinary manually
export const uploadToCloudinary = (
  buffer: Buffer
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'ai-marketlink/products',
        transformation: [
          { width: 500, height: 500, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// Upload multiple buffers to Cloudinary
export const uploadManyToCloudinary = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  return Promise.all(
    files.map((file, index) => uploadToCloudinary(file.buffer))
  );
};

export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    const urlParts = imageUrl.split('/');
    const folderIndex = urlParts.indexOf('upload');
    // Get everything after 'upload/v{version}/' as the public_id
    const publicId = urlParts
      .slice(folderIndex + 2)
      .join('/')
      .replace(/\.[^/.]+$/, '');

    await cloudinary.v2.uploader.destroy(publicId);
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err);
  }
};

export default upload;