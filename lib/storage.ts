'use client';
// Everything stays on this device: media files in OPFS, project documents in IndexedDB.
import { openDB, type IDBPDatabase } from 'idb';
import { migrate, type Project } from './project';

let dbp: Promise<IDBPDatabase> | null = null;
const db = () => (dbp ??= openDB('videoed', 2, { upgrade(d, old) {
  if (old < 1) d.createObjectStore('projects', { keyPath: 'id' });
  if (old < 2) d.createObjectStore('media');   // fallback when OPFS writing is not available (some Safari versions, private windows)
} }));

/** Can this browser write files to OPFS? (Safari added createWritable late; private windows may block OPFS.) */
let opfs: Promise<boolean> | null = null;
function opfsWritable(): Promise<boolean> {
  return (opfs ??= (async () => {
    try {
      if (!navigator.storage?.getDirectory || typeof FileSystemFileHandle === 'undefined' || !('createWritable' in FileSystemFileHandle.prototype)) return false;
      const root = await navigator.storage.getDirectory();
      const fh = await root.getFileHandle('.probe', { create: true });
      const w = await fh.createWritable(); await w.write(new Uint8Array([1])); await w.close();
      await root.removeEntry('.probe');
      return true;
    } catch { return false; }
  })());
}

export async function saveProject(p: Project) { await (await db()).put('projects', p); }
export async function loadProject(id: string): Promise<Project | undefined> { const p = await (await db()).get('projects', id); return p && migrate(p); }
export async function listProjects(): Promise<Project[]> {
  return ((await (await db()).getAll('projects')) as Project[]).map(migrate).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function deleteProject(id: string) {
  await (await db()).delete('projects', id);
  const d = await db(); for (const k of await d.getAllKeys('media')) if (String(k).startsWith(`${id}/`)) await d.delete('media', k);
  try { const root = await navigator.storage.getDirectory(); await root.removeEntry(`p-${id}`, { recursive: true }); } catch { /* nothing stored */ }
}

async function projectDir(projectId: string) {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(`p-${projectId}`, { create: true });
}
/** Copy an imported file into OPFS (streamed, no full read into memory). */
export async function storeMedia(projectId: string, assetId: string, file: File, onProgress?: (f: number) => void) {
  if (!(await opfsWritable())) {
    onProgress?.(0.5);
    try { await (await db()).put('media', file, `${projectId}/${assetId}`); }
    catch { throw new StorageFullError(); }
    onProgress?.(1); return;
  }
  const dir = await projectDir(projectId);
  const fh = await dir.getFileHandle(assetId, { create: true });
  let w: FileSystemWritableFileStream;
  try { w = await fh.createWritable(); } catch { throw new StorageFullError(); }
  const reader = file.stream().getReader();
  let done = 0;
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    try { await w.write(value); } catch { await w.abort().catch(() => {}); throw new StorageFullError(); }
    done += value.byteLength; onProgress?.(file.size ? done / file.size : 1);
  }
  await w.close();
}
export async function readMedia(projectId: string, assetId: string): Promise<File> {
  const fromDb = await (await db()).get('media', `${projectId}/${assetId}`) as File | undefined;
  if (fromDb) return fromDb;
  const dir = await projectDir(projectId);
  return (await dir.getFileHandle(assetId)).getFile();
}
export class StorageFullError extends Error { constructor() { super('No queda espacio en este navegador para guardar el archivo. Borra proyectos que no uses o libera espacio.'); } }
export async function removeMedia(projectId: string, assetId: string) {
  try { await (await db()).delete('media', `${projectId}/${assetId}`); } catch { /* none */ }
  try { (await projectDir(projectId)).removeEntry(assetId); } catch { /* already gone */ }
}

/** Ask the browser not to evict our data; report usage. */
export async function storageInfo() {
  const persisted = (await navigator.storage.persisted?.()) || (await navigator.storage.persist?.()) || false;
  const est = await navigator.storage.estimate?.();
  return { persisted, usage: est?.usage ?? 0, quota: est?.quota ?? 0 };
}
