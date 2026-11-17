'use client';
// Shared import path: probe -> copy into OPFS -> add to the project.
import { probe, ImportError } from './media';
import { storeMedia, StorageFullError } from './storage';
import type { AssetRef } from './project';

const MAX = 4 * 1024 ** 3;
export async function importOne(projectId: string, file: File, onProgress?: (f: number) => void): Promise<AssetRef> {
  if (file.size > MAX) throw new ImportError('Archivo de más de 4 GB. Recórtalo antes o expórtalo a menor calidad.');
  const info = await probe(file);
  const id = crypto.randomUUID();
  try { await storeMedia(projectId, id, file, onProgress); }
  catch (e) { throw new ImportError(e instanceof StorageFullError ? e.message : 'Este navegador no deja guardar archivos (¿ventana privada?). Abre Ownframe en una ventana normal.'); }
  return { id, ...info };
}
