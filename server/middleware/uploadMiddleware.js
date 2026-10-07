import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const uploadsDir = path.join(__dirname, '../uploads');

// Ensure base uploads directory and subfolders exist
const subfolders = ['covers', 'articles', 'avatars', 'general'];
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
for (const sub of subfolders) {
  const dir = path.join(uploadsDir, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Check file type
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp|svg/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype || extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp, svg) are allowed!'));
};

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'dummy' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'dummy' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'dummy'
);

// Helper to determine clean target subfolder
const getSubfolder = (req) => {
  const raw = (req.query?.folder || req.body?.folder || '').toLowerCase().trim();
  if (raw === 'covers' || raw === 'cover') return 'covers';
  if (raw === 'avatars' || raw === 'avatar' || raw === 'profile') return 'avatars';
  if (raw === 'general') return 'general';
  return 'articles'; // default for story/article inline content
};

let storage;

if (isCloudinaryConfigured) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const subfolder = getSubfolder(req);
      const cleanOriginalName = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9]/g, '-')
        .slice(0, 30);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);

      return {
        folder: `chills-blogg/${subfolder}`,
        public_id: `${cleanOriginalName}-${uniqueSuffix}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation:
          subfolder === 'avatars'
            ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
            : subfolder === 'covers'
            ? [{ width: 1920, height: 1080, crop: 'limit' }]
            : [{ width: 1600, height: 1600, crop: 'limit' }],
      };
    },
  });
} else {
  // Fallback to local disk storage grouped by folder
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const subfolder = getSubfolder(req);
      const targetDir = path.join(uploadsDir, subfolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const cleanName = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .slice(0, 30);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    },
  });
}

// Initialize upload (25MB limit)
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});

export default upload;