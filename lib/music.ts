// Demo music from Clipsong's demo catalogue (generated test audio, fictional
// artists). In production this list comes from Clipsong with real CC tracks.
export interface MusicTrack { id: string; file: string; title: string; artist: string; licence: string; licenceUrl: string; monetizable: boolean; durationMs: number }
const by = 'https://creativecommons.org/licenses/by/4.0/', bySa = 'https://creativecommons.org/licenses/by-sa/4.0/';
export const MUSIC: MusicTrack[] = [
  { id: 'cs-t01', file: '/music/t01.mp3', title: 'Café a las siete', artist: 'Marea Baja', licence: 'CC BY 4.0', licenceUrl: by, monetizable: true, durationMs: 42000 },
  { id: 'cs-t04', file: '/music/t04.mp3', title: 'Muelle cuatro', artist: 'Los Faros', licence: 'CC BY-SA 4.0', licenceUrl: bySa, monetizable: true, durationMs: 40000 },
  { id: 'cs-t06', file: '/music/t06.mp3', title: 'Pantalla en blanco', artist: 'Nube Ocho', licence: 'CC BY 4.0', licenceUrl: by, monetizable: true, durationMs: 48000 },
  { id: 'cs-t11', file: '/music/t11.mp3', title: 'Valle abierto', artist: 'Hilo Fino', licence: 'CC BY 4.0', licenceUrl: by, monetizable: true, durationMs: 50000 },
];
export const creditFor = (m: MusicTrack) => `Música: "${m.title}" de ${m.artist}, con licencia ${m.licence} (${m.licenceUrl}). Vía Clipsong.`;
