'use client';
// Shared import path: probe -> copy into OPFS -> add to the project.
import { probe, ImportError } from './media';
import { storeMedia } from './storage';
import type { AssetRef } from './project';

const MAX = 4 * 1024 ** 3;
export async function importOne(projectId: string, file: File, onProgress?: (f: number) => void): Promise<AssetRef> {
  if (file.size > MAX) throw new ImportError('Archivo de más de 4 GB. Recórtalo antes o expórtalo a menor calidad.');
  const info = await probe(file);
  const id = crypto.randomUUID();
  await storeMedia(projectId, id, file, onProgress);
  return { id, ...info };
}
