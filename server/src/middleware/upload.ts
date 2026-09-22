import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads/submissions');

// Ensure destination directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure disk storage engine
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e6);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${randomSuffix}-${sanitizedOriginalName}`);
  },
});

// Whitelist supported academic file types
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.sql',
  '.zip',
  '.tar',
  '.gz',
  '.py',
  '.java',
  '.cpp',
  '.c',
  '.txt',
  '.docx',
];

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type '${ext}'. Allowed file extensions: ${ALLOWED_EXTENSIONS.join(
          ', '
        )}`
      )
    );
  }
};

export const uploadSubmissionFile = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max file size
  },
  fileFilter,
});
