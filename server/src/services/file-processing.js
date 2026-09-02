import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { pdf } from "pdf-to-img";

import { env } from "../config/env.js";

import {
  downloadFromS3,
  uploadToS3,
  deleteLocalFile,
} from "./s3-storage.service.js";

const getProcessingDirectory = () => {
  return path.resolve(
    env.uploadPath,
    "processing"
  );
};

const getThumbnailDirectory = (tenantId) => {
  return path.resolve(
    env.uploadPath,
    "thumbnails",
    String(tenantId)
  );
};

const processImage = async ({
  filePath,
  thumbnailPath,
}) => {
  const metadata = await sharp(filePath).metadata();

  await sharp(filePath)
    .resize({
      width: 300,
      height: 300,
      fit: "inside",
    })
    .jpeg({
      quality: 80,
    })
    .toFile(thumbnailPath);

  return {
    width: metadata.width,
    height: metadata.height,
  };
};


const processPdf = async ({
  filePath,
  thumbnailPath,
}) => {

  const buffer = await fs.readFile(filePath);
  const pdfDocument =
    await PDFDocument.load(buffer);

  const pageCount =
    pdfDocument.getPageCount();

  console.log(
    `PDF page count: ${pageCount}`
  );

  const document = await pdf(filePath, {
    scale: 2,
    format: "jpg",
  });

  try {
    const firstPage =
      await document.getPage(1);

    if (!firstPage) {
      throw new Error(
        "Unable to render first PDF page."
      );
    }

    await sharp(firstPage)
      .resize({
        width: 300,
        height: 300,
        fit: "inside",
      })
      .jpeg({
        quality: 80,
      })
      .toFile(thumbnailPath);

    console.log(
      `PDF thumbnail generated: ${thumbnailPath}`
    );
  } finally {

    await document.destroy();
  }

  return {
    pageCount,
  };
};

const processDocx = async ({
  filePath,
  thumbnailPath,
}) => {
  throw new Error(
    "DOCX processing is not implemented yet."
  );
};

export const processFile = async ({
  file,
}) => {
  const processingDirectory =
    getProcessingDirectory();

  const thumbnailDirectory =
    getThumbnailDirectory(
      file.tenantId
    );

  await fs.mkdir(
    processingDirectory,
    {
      recursive: true,
    }
  );

  await fs.mkdir(
    thumbnailDirectory,
    {
      recursive: true,
    }
  );

  const extension =
    path.extname(file.name).toLowerCase();

  const localFileName =
    `${file._id}${extension}`;

  const localFilePath =
    path.join(
      processingDirectory,
      localFileName
    );

  const thumbnailFileName =
    `${file._id}.jpg`;

  const thumbnailPath =
    path.join(
      thumbnailDirectory,
      thumbnailFileName
    );

  console.log(
    `Downloading file from S3: ${file.storageKey}`
  );

  await downloadFromS3({
    storageKey: file.storageKey,
    destination: localFilePath,
  });

  console.log(
    `File downloaded: ${localFilePath}`
  );

  try {
    let metadata = {};

    if (
      extension === ".png" ||
      extension === ".jpg" ||
      extension === ".jpeg"
    ) {
      console.log(
        "Processing image..."
      );

      metadata =
        await processImage({
          filePath: localFilePath,
          thumbnailPath,
        });
    }

    else if (extension === ".pdf") {
      console.log(
        "Processing PDF..."
      );

      metadata =
        await processPdf({
          filePath: localFilePath,
          thumbnailPath,
        });
    }

    else if (extension === ".docx") {
      console.log(
        "Processing DOCX..."
      );

      metadata =
        await processDocx({
          filePath: localFilePath,
          thumbnailPath,
        });
    }

    else {
      throw new Error(
        `Unsupported file extension: ${extension}`
      );
    }

    console.log(
      "Extracted metadata:",
      metadata
    );

    const thumbnailKey =
      `thumbnails/${file.tenantId}/${thumbnailFileName}`;

    console.log(
      `Uploading thumbnail to S3: ${thumbnailKey}`
    );

    await uploadToS3({
      filePath: thumbnailPath,
      storageKey: thumbnailKey,
      contentType: "image/jpeg",
    });

    console.log(
      `Thumbnail uploaded: ${thumbnailKey}`
    );

    return {
      metadata,
      thumbnailKey,
    };
  } finally {
    await deleteLocalFile(
      localFilePath
    );

    await deleteLocalFile(
      thumbnailPath
    );

    console.log(
      "Temporary processing files cleaned"
    );
  }
};