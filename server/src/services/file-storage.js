
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

export const storeFileLocally = async ({
  tempPath,
  tenantId, 
  fileId,
  originalName,
}) => {
  const extension = path
    .extname(originalName)
    .toLowerCase();

  const tenantDirectory = path.join(
    env.uploadPath,
    'tenants',
    String(tenantId)
  );

  await fs.mkdir(tenantDirectory, {
    recursive: true,
  });

  const storageKey =
    `tenants/${tenantId}/${fileId}${extension}`;

  const destination = path.join(
    tenantDirectory,
    `${fileId}${extension}`
  );

  await fs.rename(
    tempPath,
    destination
  );

  return {
    storageKey,
    absolutePath: destination,
  };
};