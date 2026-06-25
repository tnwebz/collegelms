import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Automatically create the uploads directories if they don't exist
const uploadVideoDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(uploadVideoDir)) {
  fs.mkdirSync(uploadVideoDir, { recursive: true });
}

const uploadDocDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDocDir)) {
  fs.mkdirSync(uploadDocDir, { recursive: true });
}

const uploadProfileDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadProfileDir)) {
  fs.mkdirSync(uploadProfileDir, { recursive: true });
}

// Configure multer storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadVideoDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

// Configure multer storage for documents
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDocDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

// Configure multer storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadProfileDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

// Configure file filtering for videos
const videoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'));
  }
};

// Configure file filtering for documents
const documentFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and images are allowed.'));
  }
};

// Export the configured multer middleware
export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit
}).single('video');

export const uploadDocument = multer({
  storage: docStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
}).single('document');

export const uploadProfilePicture = multer({
  storage: profileStorage,
  fileFilter: documentFilter, // Reusing document filter which allows images
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('profile_picture');
