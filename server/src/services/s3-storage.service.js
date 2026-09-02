import fs from "fs";
import fsPromises from "fs/promises";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { s3Client } from "../config/s3.js";
import { env } from "../config/env.js";
import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

export const uploadToS3 = async ({
    filePath,
    storageKey,
    contentType,
  }) => {
    const { size } = await fsPromises.stat(filePath);
  
    const command = new PutObjectCommand({
      Bucket: env.bucket,
      Key: storageKey,
      Body: fs.createReadStream(filePath),
      ContentType: contentType,
      ContentLength: size,
    });
  
    await s3Client.send(command);
  
    return {
      storageKey,
    };
  };

export const downloadFromS3 = async ({
  storageKey,
  destination,
}) => {
  const command = new GetObjectCommand({
    Bucket: env.bucket,
    Key: storageKey,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`S3 object has no body: ${storageKey}`);
  }

  const writeStream = fs.createWriteStream(destination);

  await new Promise((resolve, reject) => {
    response.Body
      .pipe(writeStream)
      .on("finish", resolve)
      .on("error", reject);
  });

  return destination;
};

export const createDownloadUrl =
  async ({
    storageKey,
    expiresIn = 300,
  }) => {
    const command =
      new GetObjectCommand({
        Bucket: env.bucket,
        Key: storageKey,
      });

    const url =
      await getSignedUrl(
        s3Client,
        command,
        {
          expiresIn,
        }
      );

    return url;
  };

export const deleteLocalFile = async (filePath) => {
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

export const deleteFromS3 = async ({
  storageKey,
}) => {
  const command = new DeleteObjectCommand({
    Bucket: env.aws.bucket,
    Key: storageKey,
  });

  await s3Client.send(command);

  console.log(`File deleted from S3: ${storageKey}`);
};