import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = {
  '.pdf': 'application/pdf',

  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  '.png': 'image/png',

  '.jpg': 'image/jpeg',

  '.jpeg': 'image/jpeg',
};

const tempDirectory = path.join(
  env.uploadPath,
  'temp'
);

fs.mkdirSync(tempDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const name = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    const uniqueName =
      `${name}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, uniqueName);
  },
});

// const fileFilter = (req, file, cb) => {
//   const extension = path
//     .extname(file.originalname)
//     .toLowerCase();

//     console.log(extension,'afohasdidfhashfjkh')

//   const expectedMime = ALLOWED_TYPES[extension];
  

//   if (!expectedMime) {
//     return cb(
//       new Error(
//         'Invalid file type. Allowed types: PDF, DOCX, PNG and JPG.'
//       )
//     );
//   }

//   if (file.mimetype !== expectedMime) {
//     return cb(
//       new Error(
//         `Invalid MIME type for ${extension}.`
//       )
//     );
//   }

//   cb(null, true);
// };

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const expectedMime = ALLOWED_TYPES[extension];

  if (!expectedMime) {
    return cb(
      new Error(
        'Invalid file type. Allowed types: PDF, DOCX, PNG and JPG.'
      )
    );
  }

  cb(null, true);
};
const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
  },

  fileFilter,
});

export const uploadFile = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(422).json({
          error: true,
          statusCode: 422,
          message: 'File size cannot exceed 10 MB.',
        });
      }

      return res.status(422).json({
        error: true,
        statusCode: 422,
        message: err.message,
      });
    }

    if (err) {
      return res.status(422).json({
        error: true,
        statusCode: 422,
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(422).json({
        error: true,
        statusCode: 422,
        message: 'File is required.',
      });
    }

    next();
  });
};