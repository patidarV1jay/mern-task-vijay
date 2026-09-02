import fs from "fs";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3Client } from "../config/s3.js";
import { env } from "../config/env.js";

const filePath = "./src/services/test-s3.txt";

const fileBuffer = fs.readFileSync(filePath);

const command = new PutObjectCommand({
  Bucket: env.bucket,
  Key: "test/test-s3.txt",
  Body: fileBuffer,
  ContentType: "text/plain",
  ContentLength: fileBuffer.length,
});

await s3Client.send(command);

console.log("Uploaded successfully!");