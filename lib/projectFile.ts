'use client';
// A project as one file (.ownframe = zip): project.json + every media file.
// So a project is never stuck in one browser (fix X6). Media is stored, not recompressed.
import { zip, unzip, strToU8, strFromU8 } from 'fflate';
import { migrate, type Project } from './project';
import { readMedia, storeMedia, saveProject } from './storage';

const FORMAT = 'ownframe-project/1';

export async function exportProjectFile(p: Project, onProgress?: (f: number) => void): Promise<Blob> {
  const files: Record<string, [Uint8Array, { level: 0 }]> = {
    'project.json': [strToU8(JSON.stringify({ format: FORMAT, project: p })), { level: 0 }],
  };
  for (let i = 0; i < p.assets.length; i++) {
    const a = p.assets[i];
    files[`media/${a.id}`] = [new Uint8Array(await (await readMedia(p.id, a.id)).arrayBuffer()), { level: 0 }];
    onProgress?.((i + 1) / (p.assets.length + 1));
  }
  const data = await new Promise<Uint8Array>((res, rej) => zip(files, (err, out) => (err ? rej(err) : res(out))));
  onProgress?.(1);
  return new Blob([data as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
}

export class ProjectFileError extends Error {}

/** Import as a NEW project (new id), so it never overwrites one already in this browser. */
export async function importProjectFile(file: File): Promise<Project> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const entries = await new Promise<Record<string, Uint8Array>>((res, rej) => unzip(buf, (err, out) => (err ? rej(new ProjectFileError('Este archivo no es un proyecto de Ownframe.')) : res(out))));
  const meta = entries['project.json'];
  if (!meta) throw new ProjectFileError('Este archivo no es un proyecto de Ownframe.');
  let parsed: { format?: string; project?: Project };
  try { parsed = JSON.parse(strFromU8(meta)); } catch { throw new ProjectFileError('El proyecto está dañado.'); }
  if (parsed.format !== FORMAT || !parsed.project?.assets) throw new ProjectFileError('Este proyecto es de una versión que no reconocemos.');
  const p = migrate({ ...parsed.project, id: crypto.randomUUID(), updatedAt: Date.now() });
  for (const a of p.assets) {
    const bytes = entries[`media/${a.id}`];
    if (!bytes) throw new ProjectFileError(`Falta el archivo «${a.name}» dentro del proyecto.`);
    await storeMedia(p.id, a.id, new File([bytes as Uint8Array<ArrayBuffer>], a.name, { type: a.mime }));
  }
  await saveProject(p);
  return p;
}
