'use client';
// Everything stays on this device: media files in OPFS, project documents in IndexedDB.
import { openDB, type IDBPDatabase } from 'idb';
import { migrate, type Project } from './project';

let dbp: Promise<IDBPDatabase> | null = null;
const db = () => (dbp ??= openDB('videoed', 1, { upgrade(d) { d.createObjectStore('projects', { keyPath: 'id' }); } }));

export async function saveProject(p: Project) { await (await db()).put('projects', p); }
export async function loadProject(id: string): Promise<Project | undefined> { const p = await (await db()).get('projects', id); return p && migrate(p); }
export async function listProjects(): Promise<Project[]> {
  return ((await (await db()).getAll('projects')) as Project[]).map(migrate).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function deleteProject(id: string) {
  await (await db()).delete('projects', id);
  try { const root = await navigator.storage.getDirectory(); await root.removeEntry(`p-${id}`, { recursive: true }); } catch { /* nothing stored */ }
}

async function projectDir(projectId: string) {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(`p-${projectId}`, { create: true });
}
/** Copy an imported file into OPFS (streamed, no full read into memory). */
export async function storeMedia(projectId: string, assetId: string, file: File, onProgress?: (f: number) => void) {
  const dir = await projectDir(projectId);
  const fh = await dir.getFileHandle(assetId, { create: true });
  const w = await fh.createWritable();
  const reader = file.stream().getReader();
  let done = 0;
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    await w.write(value); done += value.byteLength; onProgress?.(file.size ? done / file.size : 1);
  }
  await w.close();
}
export async function readMedia(projectId: string, assetId: string): Promise<File> {
  const dir = await projectDir(projectId);
  return (await dir.getFileHandle(assetId)).getFile();
}
export async function removeMedia(projectId: string, assetId: string) {
  try { (await projectDir(projectId)).removeEntry(assetId); } catch { /* already gone */ }
}

/** Ask the browser not to evict our data; report usage. */
export async function storageInfo() {
  const persisted = (await navigator.storage.persisted?.()) || (await navigator.storage.persist?.()) || false;
  const est = await navigator.storage.estimate?.();
  return { persisted, usage: est?.usage ?? 0, quota: est?.quota ?? 0 };
}
